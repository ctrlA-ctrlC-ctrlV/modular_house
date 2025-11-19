#!/usr/bin/env tsx
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENAPI_PATH = path.join(__dirname, '..', 'openapi.yaml');

interface ValidationError {
  path: string;
  message: string;
}

function validateOpenAPISpec(): ValidationError[] {
  const errors: ValidationError[] = [];

  try {
    // Read and parse the OpenAPI YAML file
    const yamlContent = fs.readFileSync(OPENAPI_PATH, 'utf8');
    const spec = yaml.load(yamlContent) as Record<string, unknown>;

    // Basic structure validation
    if (!spec.openapi) {
      errors.push({ path: 'openapi', message: 'Missing openapi version' });
    }

    if (!spec.info) {
      errors.push({ path: 'info', message: 'Missing info section' });
    } else {
      const info = spec.info as Record<string, unknown>;
      if (!info.title) {
        errors.push({ path: 'info.title', message: 'Missing API title' });
      }
      if (!info.version) {
        errors.push({ path: 'info.version', message: 'Missing API version' });
      }
    }

    if (!spec.paths) {
      errors.push({ path: 'paths', message: 'Missing paths section' });
    }

    // Validate required endpoints exist
    const paths = spec.paths as Record<string, unknown>;
    const requiredPaths = [
      '/health',
      '/submissions/enquiry',
      '/admin/auth/login',
      '/content/pages/{slug}',
      '/content/gallery',
      '/content/faqs'
    ];

    for (const requiredPath of requiredPaths) {
      if (!paths[requiredPath]) {
        errors.push({ 
          path: `paths.${requiredPath}`, 
          message: `Missing required endpoint: ${requiredPath}` 
        });
      }
    }

    // Validate components section
    if (!spec.components) {
      errors.push({ path: 'components', message: 'Missing components section' });
    } else {
      const components = spec.components as Record<string, unknown>;
      if (!components.schemas) {
        errors.push({ path: 'components.schemas', message: 'Missing schemas section' });
      } else {
        const schemas = components.schemas as Record<string, unknown>;
        const requiredSchemas = [
          'SubmissionCreate',
          'Page', 
          'GalleryItem',
          'FAQ'
        ];

        for (const requiredSchema of requiredSchemas) {
          if (!schemas[requiredSchema]) {
            errors.push({ 
              path: `components.schemas.${requiredSchema}`, 
              message: `Missing required schema: ${requiredSchema}` 
            });
          }
        }
      }

      if (!components.securitySchemes) {
        errors.push({ path: 'components.securitySchemes', message: 'Missing security schemes' });
      }
    }

    return errors;

  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      errors.push({ 
        path: 'yaml', 
        message: `YAML parsing error: ${error.message}` 
      });
    } else if (error instanceof Error) {
      errors.push({ 
        path: 'file', 
        message: `File reading error: ${error.message}` 
      });
    } else {
      errors.push({ 
        path: 'unknown', 
        message: 'Unknown validation error' 
      });
    }
    return errors;
  }
}

function main(): void {
  console.log('Validating OpenAPI specification...');
  console.log(`File: ${OPENAPI_PATH}`);
  
  const errors = validateOpenAPISpec();
  
  if (errors.length === 0) {
    console.log('OpenAPI specification is valid!');
    process.exit(0);
  } else {
    console.log('OpenAPI specification has validation errors:');
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. [${error.path}] ${error.message}`);
    });
    process.exit(1);
  }
}

main();