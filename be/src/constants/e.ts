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
