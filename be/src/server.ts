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
import { connectDB } from "./config/database.js";

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

const execServer = async () => {
  const app = express();

  // Connect to MongoDB
  try {
    await connectDB();
  } catch (error) {
    console.warn(
      "⚠️  Continuing without database. Auth features will be disabled.",
    );
  }

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

  // Welcome route
  app.get("/", (req, res) => {
    res.send(welcomeHtml);
  });

  // Webhook routes (MUST be before /api router to avoid auth middleware)
  app.use("/api/git", router.gitRouter);

  // Authentication routes (new)
  app.use("/api/auth", router.authRouter);

  // Deployment routes (with authentication)
  app.use("/api/v1/deploy", router.deployRouter);

  // Repository and deployment management routes (new, protected)
  app.use("/api", router.repoRouter);

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

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(
      `API documentation available at: http://localhost:${PORT}/api/docs`,
    );
    console.log(
      `ReDoc documentation available at: http://localhost:${PORT}/api/redoc`,
    );
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
