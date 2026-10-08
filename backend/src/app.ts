import express from "express";
import cors from "cors";

import authRouter from "./modules/auth/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import workspaceRouter from "./modules/workspace/workspace.routes.js";
import boardRouter from "./modules/boards/board.routes.js"
import boardDetailRouter from "./modules/boards/board-detail.routes.js"
import listRouter from "./modules/list/list.routes.js";
import taskRouter from "./modules/task/task.routes.js";
import labelRouter from "./modules/labels/label.routes.js";
import commentRouter from "./modules/comment/comment.routes.js";
import activityRouter from "./modules/activity/activity.routes.js";
import subtaskRouter from "./modules/subtask/subtask.routes.js";
import notificationRouter from "./modules/notification/notification.routes.js";
import searchRouter from "./modules/search/search.routes.js";
import attachmentRouter from "./modules/attachment/attachment.routes.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
    cors({
        origin: "*",
        
    })
);

app.use(express.json());
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

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
app.use(
    "/api/v1/workspaces",
    boardRouter
);

app.use(
    "/api/v1/boards",
    boardDetailRouter
);

app.use("/api/v1", listRouter);
app.use("/api/v1", taskRouter);
app.use("/api/v1", labelRouter);
app.use("/api/v1", commentRouter);
app.use("/api/v1", activityRouter);
app.use("/api/v1", subtaskRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1", attachmentRouter);

// Always keep this LAST
app.use(errorHandler);

export default app;