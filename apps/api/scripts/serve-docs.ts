#!/usr/bin/env tsx
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.DOCS_PORT || 3001;
const OPENAPI_PATH = path.join(__dirname, '..', 'openapi.yaml');

async function startDocsServer(): Promise<void> {
  try {
    // Read and parse the OpenAPI YAML file
    const yamlContent = fs.readFileSync(OPENAPI_PATH, 'utf8');
    const swaggerDocument = yaml.load(yamlContent) as Record<string, unknown>;

    // Create Express app
    const app = express();

    // Swagger UI options
    const swaggerOptions = {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0 }
      `,
      customSiteTitle: 'Modular House API Documentation',
    };

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        service: 'api-docs',
        timestamp: new Date().toISOString() 
      });
    });

    // Serve raw OpenAPI spec
    app.get('/openapi.yaml', (req, res) => {
      res.setHeader('Content-Type', 'application/x-yaml');
      res.send(yamlContent);
    });

    app.get('/openapi.json', (req, res) => {
      res.json(swaggerDocument);
    });

    // Serve Swagger UI
    app.use('/docs', swaggerUi.serve);
    app.get('/docs', swaggerUi.setup(swaggerDocument, swaggerOptions));

    // Redirect root to docs
    app.get('/', (req, res) => {
      res.redirect('/docs');
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`API Documentation server started`);
      console.log(`Swagger UI: http://localhost:${PORT}/docs`);
      console.log(`OpenAPI YAML: http://localhost:${PORT}/openapi.yaml`);
      console.log(`OpenAPI JSON: http://localhost:${PORT}/openapi.json`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Press Ctrl+C to stop the server`);
    });

  } catch (error) {
    console.error('Failed to start documentation server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down documentation server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down documentation server...');
  process.exit(0);
});

// Start the server
startDocsServer().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});