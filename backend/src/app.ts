import express from "express";
import authRouter from "./modules/auth/auth.routes.js";

const app = express();

app.use(express.json());

app.get("/api/v1/health", (req, res) => {
    res.json({
        success: true,
        data: {
            service: "wabi-api",
            status: "ok",
        },
    });
});

app.use("/api/v1/auth", authRouter);


export default app;