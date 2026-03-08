import express from "express";
import http from "http";
import { corsOptions, PORT, isProd } from "./constants/e.js";
import cors from "cors";
import { router } from "./router/index.js";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { redoclyHtml } from "./config/redocly.js";
import { welcomeHtml } from "./config/general.js";

// Suppress DEP0169 warning from swagger-ui-express dependency
const originalEmitWarning = process.emitWarning;
process.emitWarning = function (warning, ...args: any[]) {
  if (typeof warning === "string" && warning.includes("DEP0169")) {
    return; // Suppress DEP0169 warning
  }
  return (originalEmitWarning as any).call(process, warning, ...args);
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execServer = () => {
  const app = express();

  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP for Swagger UI
    }),
  );

  // Serve static files from local directory in development
  if (!isProd) {
    const localDir = path.join(__dirname, "../local");
    app.use("/local", express.static(localDir));
    console.log(`Serving local files from: ${localDir}`);
  }

  // API Documentation
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Serve swagger JSON
  app.get("/api/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // ReDoc Documentation
  app.get("/api/redoc", (req, res) => {
    res.send(redoclyHtml);
  });

  // Welcome route
  app.get("/", (req, res) => {
    res.send(welcomeHtml);
  });

  // public api
  app.use("/api/v1", router.deployRouter);

  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

execServer();

// For testing purpose only ---------------------------------------------------
// Optional startup clone for local testing only.
// if (process.env.GH_CLONE_TEST_URL) {
//   console.log("init clone.......");
//   void clonefromGh(process.env.GH_CLONE_TEST_URL).catch((error) => {
//     console.error("Startup clone failed:", error);
//   });
//   void uploadtoServer(process.env.GH_CLONE_TEST_URL).catch((error) => {
//     console.error("Startup upload failed:", error);
//   });
// }
