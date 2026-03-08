import swaggerJsdoc from "swagger-jsdoc";
import { PORT } from "../constants/e.js";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hostify API Documentation",
      version: "1.0.0",
      description:
        "A Node.js backend service that automatically deploys static websites from GitHub repositories to Azure Blob Storage with custom subdomain support and Cloudflare KV integration.",
      contact: {
        name: "Hostify",
        url: "https://github.com/pandarudra/hostify",
      },
      license: {
        name: "ISC",
        url: "https://opensource.org/licenses/ISC",
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
      {
        url: "https://api.rudrax.me",
        description: "Production server",
      },
    ],
    tags: [
      {
        name: "Deployment",
        description:
          "Deploy GitHub repositories to Azure with custom subdomains",
      },
    ],
    components: {
      schemas: {
        DeployRequest: {
          type: "object",
          required: ["ghlink"],
          properties: {
            ghlink: {
              type: "string",
              description: "GitHub repository URL (must be public)",
              example: "https://github.com/username/repository.git",
            },
            subdomain: {
              type: "string",
              description:
                "Custom subdomain name (optional, defaults to generated folder name)",
              example: "my-awesome-site",
            },
          },
        },
        DeploySuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Deployment successful",
            },
            blobPath: {
              type: "object",
              properties: {
                folderName: {
                  type: "string",
                  description: "Generated folder name in storage",
                  example: "repository-abc123",
                },
                subdomain: {
                  type: "string",
                  description: "Subdomain used for the deployment",
                  example: "my-awesome-site",
                },
                path: {
                  type: "string",
                  description: "Storage path or local path",
                  example: "repository-abc123",
                },
                url: {
                  type: "string",
                  description: "Deployed website URL",
                  example: "https://my-awesome-site.rudrax.me",
                },
              },
            },
          },
        },
        DeployErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Deployment failed",
            },
            error: {
              type: "string",
              description: "Error message details",
              example: "GitHub link is required",
            },
          },
        },
      },
    },
  },
  apis: ["./src/router/*.ts", "./dist/router/*.js"], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
