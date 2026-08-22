import express from "express";

const app = express();

app.use(express.json());

app.get("/api/v1/health", (req, res) => {
    res.json({
        success: true,
        data: {
            service: "wabi-api",
            status: "ok"
        }
    });
});

export default app;