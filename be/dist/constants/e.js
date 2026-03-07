import dotenv from "dotenv";
dotenv.config();
export const PORT = Number(process.env.PORT);
export const corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
export const uploadDir = process.env.UPLOAD_DIR;
// Azure Storage Configuration
export const AZURE_STORAGE_ACCOUNT_NAME = process.env
    .AZURE_STORAGE_ACCOUNT_NAME;
export const AZURE_STORAGE_CONTAINER_NAME = process.env
    .AZURE_STORAGE_CONTAINER_NAME;
export const AZURE_STORAGE_SAS_TOKEN = process.env
    .AZURE_STORAGE_SAS_TOKEN;
//# sourceMappingURL=e.js.map