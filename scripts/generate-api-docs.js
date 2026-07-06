const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
const Converter = require('openapi-to-postmanv2');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Generates OpenAPI (Swagger) per module, a single merged Postman collection
 * (with each module as a folder), and a single environment file per environment.
 *
 * Output structure:
 *
 * docs/
 * ├── index.json
 * ├── postman_collection.json          ← single merged collection
 * ├── environments/
 * │   ├── local.postman_environment.json
 * │   ├── staging.postman_environment.json
 * │   └── production.postman_environment.json
 * ├── openapi/
 * │   ├── core_openapi.json
 * │   └── fintech_openapi.json
 *
 * @param {Object} options
 * @param {import('@nestjs/common').INestApplication} options.app
 * NestJS application instance.
 *
 * @param {string} [options.output='./docs']
 * Directory where documentation will be generated.
 *
 * @param {string} [options.title]
 * Title for the merged Postman collection. Defaults to package name.
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
 * @param {Object} [options.auth]
 * Auth / token configuration for the built-in Postman scripts.
 *
 * @param {string} [options.auth.refreshPath='/auth/refresh']
 * API path used by the pre-request auto-refresh script.
 * Combined with {{base_url}} at runtime, e.g. POST {{base_url}}/auth/refresh.
 *
 * @param {string} [options.auth.refreshBodyKey='refresh_token']
 * JSON body key sent to the refresh endpoint. Defaults to 'refresh_token'.
 *
 * @param {string} [options.auth.tokenResponsePath='data']
 * Dot-separated path inside the response JSON where tokens live.
 * e.g. 'data' means json.data.access_token / json.data.refresh_token.
 * Leave empty ('') to look directly on the root response object.
 *
 * @param {Object} [options.events]
 * Override the built-in collection-level Postman scripts.
 *
 * @param {string} [options.events.prerequest]
 * Custom pre-request script (JS string). Replaces the built-in auto-refresh.
 *
 * @param {string} [options.events.test]
 * Custom post-response (test) script (JS string). Replaces the built-in token capture.
 *
 * @returns {Promise<void>}
 *
 * @example
 * await generateSwaggerDocs({
 *   app,
 *   output: './docs',
 *   title: 'My API',
 *
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
 *
 *   environments: {
 *     local: {
 *       baseUrl: 'http://localhost:3000',
 *       variables: {
 *         access_token: '',
 *         refresh_token: '',
 *         token_expiry: '',
 *         tenant_id: '',
 *       },
 *     },
 *     staging: {
 *       baseUrl: 'https://staging.example.com',
 *       variables: {
 *         access_token: '',
 *         refresh_token: '',
 *         token_expiry: '',
 *       },
 *     },
 *     production: {
 *       baseUrl: 'https://api.example.com',
 *       variables: {
 *         access_token: '',
 *         refresh_token: '',
 *         token_expiry: '',
 *       },
 *     },
 *   },
 *
 *   // Auth config — used by the built-in pre-request (auto-refresh) and
 *   // post-response (token capture) collection scripts.
 *   auth: {
 *     // POST {{base_url}}/auth/refresh — called automatically when the
 *     // access token is expired or within 60 seconds of expiring.
 *     refreshPath: '/auth/refresh',
 *
 *     // Body key sent to the refresh endpoint: { refresh_token: '...' }
 *     refreshBodyKey: 'refresh_token',
 *
 *     // Where tokens live in the response. 'data' means json.data.access_token.
 *     // Set to '' if tokens are directly on the root: json.access_token.
 *     tokenResponsePath: 'data',
 *   },
 *
 *   // Optional: fully replace either built-in script with your own JS string.
 *   // events: {
 *   //   prerequest: `... custom pre-request JS ...`,
 *   //   test:       `... custom post-response JS ...`,
 *   // },
 * });
 */
async function generateSwaggerDocs(options) {
  const output = options.output || './docs';

  // delete the output directory if it exists
  if (fs.existsSync(output)) {
    fs.rmSync(output, { recursive: true });
  }

  fs.mkdirSync(output, { recursive: true });

  const openApiDir = path.join(output, 'openapi');
  fs.mkdirSync(openApiDir, { recursive: true });

  const envDir = path.join(output, 'environments');
  fs.mkdirSync(envDir, { recursive: true });

  const packageJson = require(path.join(process.cwd(), 'package.json'));

  const generatedModules = [];

  // Accumulates each module's Postman items (folders/requests)
  const mergedItems = [];

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
      openApiDir,
      moduleConfig,
      document,
      packageJson,
      mergedItems,
    );

    generatedModules.push(moduleMeta);
  }

  // -----------------------------
  // SINGLE MERGED POSTMAN COLLECTION
  // -----------------------------
  const collectionName = options.title || packageJson.name || 'API';

  // --- Auth config (used by built-in scripts) ---
  const auth = options.auth || {};
  const refreshPath = auth.refreshPath || '/auth/refresh';
  const refreshKey = auth.refreshBodyKey || 'refreshToken';

  // --- Pre-request: auto-refresh when access token is expired ---
  const defaultPrerequest = `
// Auto-refresh access token when it is expired or about to expire (60 s buffer).
var accessToken  = pm.environment.get('accessToken');
var refreshToken = pm.environment.get('refreshToken');

if (!accessToken || !refreshToken) return;

function isExpired(token) {
    try {
        // Decode JWT payload (works in Postman's sandbox)
        var payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now() + 60000; // 60 s buffer
    } catch (e) {
        // Fallback: use stored expiry timestamp
        var expiry = pm.environment.get('tokenExpiresIn');
        return !expiry || Date.now() >= (parseInt(expiry) - 60000);
    }
}

if (!isExpired(accessToken)) return;

// Token is expired — refresh it synchronously before the request fires.
var baseUrl = pm.environment.get('baseUrl');
pm.sendRequest({
    url: baseUrl + '${refreshPath}',
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    body: { mode: 'raw', raw: JSON.stringify({ ${refreshKey}: refreshToken }) }
}, function (err, res) {
    if (err || res.code >= 400) {
        console.warn('[auth] Token refresh failed:', err || res.status);
        return;
    }
    try {
        var tokens = res.json();
        if (tokens.accessToken) pm.environment.set('accessToken',  tokens.accessToken);
        if (tokens.refreshToken) pm.environment.set('refreshToken', tokens.refreshToken);
        if (tokens.expiresIn) {
            pm.environment.set('tokenExpiresIn', String(Date.now() + tokens.expiresIn * 1000));
        }
        console.log('[auth] Access token refreshed successfully.');
    } catch (e) { console.warn('[auth] Could not parse refresh response:', e); }
});
`.trim();

  // --- Test (post-response): capture tokens from any auth response ---
  const defaultTest = `
// Capture accessToken / refreshToken from any response that contains them.
try {
    var tokens = pm.response.json();
    if (!tokens) return;
    if (tokens.accessToken) pm.environment.set('accessToken',  tokens.accessToken);
    if (tokens.refreshToken) pm.environment.set('refreshToken', tokens.refreshToken);
    if (tokens.expiresIn) {
        pm.environment.set('tokenExpiresIn', String(Date.now() + tokens.expiresIn * 1000));
    }
} catch (e) { /* response is not JSON or has no tokens — ignore */ }
`.trim();

  const prereqScript = (options.events && options.events.prerequest) || defaultPrerequest;
  const testScript = (options.events && options.events.test) || defaultTest;

  const collectionEvents = [
    {
      listen: 'prerequest',
      script: { type: 'text/javascript', exec: prereqScript.split('\n') },
    },
    {
      listen: 'test',
      script: { type: 'text/javascript', exec: testScript.split('\n') },
    },
  ];

  const mergedCollection = {
    info: {
      _postman_id: crypto.randomUUID(),
      name: collectionName,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    event: collectionEvents,
    item: mergedItems,
    auth: {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }],
    },
  };

  setPostmanAuthInheritance(mergedCollection.item);

  fs.writeFileSync(
    path.join(output, 'postman_collection.json'),
    JSON.stringify(mergedCollection, null, 2),
  );

  console.log(`✓ Postman collection → ${path.join(output, 'postman_collection.json')}`);

  // -----------------------------
  // ENVIRONMENTS — one file per env, directly importable in Postman
  // -----------------------------
  const envFiles = {};

  for (const [envName, envConfig] of Object.entries(options.environments || {})) {
    const baseUrl = typeof envConfig === 'string' ? envConfig : envConfig.baseUrl;
    const variables = typeof envConfig === 'string' ? {} : envConfig.variables || {};

    const values = [{ key: 'baseUrl', value: baseUrl, type: 'default', enabled: true }];

    for (const [key, value] of Object.entries(variables)) {
      values.push({ key, value, type: 'default', enabled: true });
    }

    const filePath = path.join(envDir, `${envName}.postman_environment.json`);

    fs.writeFileSync(
      filePath,
      JSON.stringify(
        {
          id: crypto.randomUUID(),
          name: envName,
          values,
          _postman_variable_scope: 'environment',
        },
        null,
        2,
      ),
    );

    envFiles[envName] = `environments/${envName}.postman_environment.json`;

    console.log(`✓ Environment "${envName}" → ${filePath}`);
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

    collection: 'postman_collection.json',

    environments: envFiles,

    modules: generatedModules,
  };

  fs.writeFileSync(path.join(output, 'index.json'), JSON.stringify(index, null, 2));

  console.log(`✓ Documentation generated at ${output}`);
}

/**
 * Normalize Postman auth so child items inherit from the collection.
 *
 * Postman represents "inherit" by omitting the auth field entirely — not
 * `{ type: 'inherit' }`, which Newman/Postman runtime cannot execute.
 *
 * @param {Array<Object>} items
 */
function setPostmanAuthInheritance(items) {
  if (!Array.isArray(items)) return;

  for (const item of items) {
    if (item.request) {
      const authType = item.request.auth?.type;

      // Keep explicit no-auth endpoints (e.g. login). Strip bearer/apikey
      // added by openapi-to-postman so collection-level auth applies instead.
      if (authType && authType !== 'noauth') {
        delete item.request.auth;
        delete item.request.currentHelper;
        delete item.request.helperAttributes;

        if (Array.isArray(item.request.header)) {
          item.request.header = item.request.header.filter(
            (header) => header.key?.toLowerCase() !== 'authorization',
          );
        }
      }

      delete item.auth;
    } else {
      delete item.auth;
      delete item.currentHelper;
      delete item.helperAttributes;
    }

    if (Array.isArray(item.item)) {
      setPostmanAuthInheritance(item.item);
    }
  }
}

/**
 * Generate docs for a single module.
 * Writes openapi.json and pushes the module's Postman items into mergedItems.
 *
 * @param {string} output
 * @param {Object} moduleConfig
 * @param {Object} document  OpenAPI document
 * @param {Object} packageJson
 * @param {Array}  mergedItems  Accumulator for the merged collection items
 */
async function generateModule(output, moduleConfig, document, packageJson, mergedItems) {
  // -----------------------------
  // OpenAPI JSON
  // -----------------------------
  const openApi = JSON.stringify(document, null, 2);

  fs.writeFileSync(path.join(output, `${moduleConfig.name}_openapi.json`), openApi);

  // -----------------------------
  // Convert to Postman & push items into the shared accumulator
  // -----------------------------
  await new Promise((resolve, reject) => {
    Converter.convert(
      { type: 'string', data: openApi },
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

        // Wrap this module's requests/folders inside a named top-level folder
        // so the merged collection stays clearly organised by module.
        const moduleFolder = {
          name: moduleConfig.title || moduleConfig.name,
          description: moduleConfig.description || '',
          item: collection.item || [],
        };

        setPostmanAuthInheritance(moduleFolder.item);

        mergedItems.push(moduleFolder);

        resolve();
      },
    );
  });

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
    },
  };
}

module.exports = {
  generateSwaggerDocs,
};
