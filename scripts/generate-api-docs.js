const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
const Converter = require('openapi-to-postmanv2');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Generates OpenAPI (Swagger), Postman collections and Postman environments
 * for one or more NestJS modules.
 *
 * Output structure:
 *
 * docs/
 * ├── index.json
 * ├── core/
 * │   ├── openapi.json
 * │   ├── postman_collection.json
 * │   └── environments/
 * │       ├── local.postman_environment.json
 * │       ├── staging.postman_environment.json
 * │       └── production.postman_environment.json
 * │
 * └── fintech/
 *     ├── openapi.json
 *     ├── postman_collection.json
 *     └── environments/
 *         ├── local.postman_environment.json
 *         ├── staging.postman_environment.json
 *         └── production.postman_environment.json
 *
 * @param {Object} options
 * @param {import('@nestjs/common').INestApplication} options.app
 * NestJS application instance.
 *
 * @param {string} [options.output='./docs']
 * Directory where documentation will be generated.
 *
 * @param {Array<Object>} options.modules
 * List of modules to generate documentation for.
 *
 * @param {string} options.modules[].name
 * Folder name used under the output directory.
 *
 * @param {import('@nestjs/common').Type<any>} options.modules[].module
 * NestJS module class.
 *
 * @param {string} options.modules[].title
 * Swagger title.
 *
 * @param {string} [options.modules[].description]
 * Swagger description.
 *
 * @param {string} [options.modules[].version='1.0.0']
 * Swagger version.
 *
 * @param {Object<string, Object>} [options.environments]
 * Postman environments to generate.
 *
 * @param {string} options.environments.<name>.baseUrl
 * Base URL for the environment.
 *
 * @param {Object<string,string>} [options.environments.<name>.variables]
 * Additional Postman variables.
 *
 * @returns {Promise<void>}
 *
 * @example
 * await generateSwaggerDocs({
 *   app,
 *   output: './docs',
 *   modules: [
 *     {
 *       name: 'core',
 *       module: CoreModule,
 *       title: 'Core API',
 *       description: 'Core module endpoints',
 *     },
 *     {
 *       name: 'fintech',
 *       module: FintechModule,
 *       title: 'Fintech API',
 *       description: 'Fintech module endpoints',
 *     },
 *   ],
 *   environments: {
 *     local: {
 *       baseUrl: 'http://localhost:3000',
 *       variables: {
 *         access_token: '',
 *         refresh_token: '',
 *         tenant_id: '',
 *       },
 *     },
 *     staging: {
 *       baseUrl: 'https://staging.example.com',
 *       variables: {
 *         access_token: '',
 *         refresh_token: '',
 *       },
 *     },
 *     production: {
 *       baseUrl: 'https://api.example.com',
 *       variables: {
 *         access_token: '',
 *         refresh_token: '',
 *       },
 *     },
 *   },
 * });
 */
async function generateSwaggerDocs(options) {
  const output = options.output || './docs';

  fs.mkdirSync(output, { recursive: true });

  const packageJson = require(path.join(process.cwd(), 'package.json'));

  const generatedModules = [];

  for (const moduleConfig of options.modules) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(moduleConfig.title)
      .setDescription(moduleConfig.description || '')
      .setVersion(moduleConfig.version || '1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(options.app, swaggerConfig, {
      include: [moduleConfig.module],
      deepScanRoutes: true,
    });

    const moduleMeta = await generateModule(
      output,
      moduleConfig,
      document,
      options.environments || {},
      packageJson,
    );

    generatedModules.push(moduleMeta);
  }

  // -----------------------------
  // INDEX.JSON (GLOBAL MANIFEST)
  // -----------------------------
  const index = {
    schemaVersion: '1.0.0',

    generatedAt: new Date().toISOString(),

    generator: {
      name: '@colveor/devkit',
    },

    package: {
      name: packageJson.name,
      version: packageJson.version,
    },

    summary: {
      modules: generatedModules.length,
      environments: Object.keys(options.environments || {}),
    },

    modules: generatedModules,
  };

  fs.writeFileSync(path.join(output, 'index.json'), JSON.stringify(index, null, 2));

  console.log(`✓ Documentation generated at ${output}`);
}

/**
 * Generate docs for a single module
 */
async function generateModule(output, moduleConfig, document, environments, packageJson) {
  const moduleDir = path.join(output, moduleConfig.name);
  const envDir = path.join(moduleDir, 'environments');

  fs.mkdirSync(moduleDir, { recursive: true });
  fs.mkdirSync(envDir, { recursive: true });

  // -----------------------------
  // OpenAPI JSON
  // -----------------------------
  const openApi = JSON.stringify(document, null, 2);

  fs.writeFileSync(path.join(moduleDir, 'openapi.json'), openApi);

  // -----------------------------
  // Postman Collection
  // -----------------------------
  await new Promise((resolve, reject) => {
    Converter.convert(
      {
        type: 'string',
        data: openApi,
      },
      {
        folderStrategy: 'Tags',
        requestParametersResolution: 'Example',
        exampleParametersResolution: 'Example',
      },
      (err, result) => {
        if (err) return reject(err);

        if (!result?.result) {
          return reject(result?.reason || 'Postman conversion failed');
        }

        const collection = result.output?.[0]?.data;

        if (!collection) {
          return reject('No Postman collection generated');
        }

        collection.info.name = moduleConfig.name;

        fs.writeFileSync(
          path.join(moduleDir, 'postman_collection.json'),
          JSON.stringify(collection, null, 2),
        );

        resolve();
      },
    );
  });

  // -----------------------------
  // Environments
  // -----------------------------
  const envMap = {};

  for (const [envName, envConfig] of Object.entries(environments)) {
    const baseUrl = typeof envConfig === 'string' ? envConfig : envConfig.baseUrl;

    const variables = typeof envConfig === 'string' ? {} : envConfig.variables || {};

    const values = [
      {
        key: 'base_url',
        value: baseUrl,
        enabled: true,
      },
    ];

    for (const [key, value] of Object.entries(variables)) {
      values.push({
        key,
        value,
        enabled: true,
      });
    }

    const filePath = path.join(envDir, `${envName}.postman_environment.json`);

    fs.writeFileSync(
      filePath,
      JSON.stringify(
        {
          id: crypto.randomUUID(),
          name: envName,
          values,
        },
        null,
        2,
      ),
    );

    envMap[envName] = `${moduleConfig.name}/environments/${envName}.postman_environment.json`;
  }

  // -----------------------------
  // MODULE METADATA (for index.json)
  // -----------------------------
  return {
    id: moduleConfig.name,
    name: moduleConfig.name,
    title: moduleConfig.title,
    description: moduleConfig.description || '',
    version: moduleConfig.version || packageJson.version,

    files: {
      openapi: `${moduleConfig.name}/openapi.json`,
      postmanCollection: `${moduleConfig.name}/postman_collection.json`,
    },

    environments: envMap,
  };
}

module.exports = {
  generateSwaggerDocs,
};
