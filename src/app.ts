import express from "express";
import webhookRouter from "./routes/webhook.routes";

export function buildApp() {
    const app = express();

    app.use(express.json());

    app.get("/health", (_req, res) => {
        res.status(200).json({ ok: true });
    });

    app.use("/webhook", webhookRouter);

    return app;
}
