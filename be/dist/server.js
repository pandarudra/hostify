import express from "express";
import http from "http";
import { corsOptions, PORT } from "./constants/e.js";
import cors from "cors";
import { router } from "./router/index.js";
import helmet from "helmet";
const execServer = () => {
    const app = express();
    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(helmet());
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
//# sourceMappingURL=server.js.map