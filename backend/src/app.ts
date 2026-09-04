import express from "express";
import cors from "cors";

import authRouter from "./modules/auth/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import workspaceRouter from "./modules/workspace/workspace.routes.js";

const app = express();

app.use(
    cors({
        origin: "*",
        
    })
);

app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
    res.json({
        success: true,
        data: {
            service: "wabi-api",
            status: "ok",
        },
    });
});

app.use("/api/v1/auth", authRouter);
app.use(
    "/api/v1/workspaces",
    workspaceRouter
);

// Always keep this LAST
app.use(errorHandler);

export default app;