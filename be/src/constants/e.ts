import dotenv from "dotenv";
dotenv.config();

export const PORT = Number(process.env.PORT);
export const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
export const uploadDir = process.env.UPLOAD_DIR as string;

// Azure Storage Configuration
export const AZURE_STORAGE_ACCOUNT_NAME = process.env
  .AZURE_STORAGE_ACCOUNT_NAME as string;
export const AZURE_STORAGE_CONTAINER_NAME = process.env
  .AZURE_STORAGE_CONTAINER_NAME as string;
export const AZURE_STORAGE_SAS_TOKEN = process.env
  .AZURE_STORAGE_SAS_TOKEN as string;

// cloudflare configuration
export const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID as string;
export const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID as string;
export const CF_API_TOKEN = process.env.CF_API_TOKEN as string;

// GitHub webhook secret for signature verification
export const GITHUB_WEBHOOK_SECRET = process.env
  .GITHUB_WEBHOOK_SECRET as string;

// deployment constants for production
export const isProd = (process.env.ENV as string) === "production";
export const PROD_DEPLOYMENT_URL = process.env.PROD_URL as string;
export const LOCAL_WEBHOOK_URL =
  process.env.LOCAL_WEBHOOK_URL || `http://localhost:${PORT}`;
