import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import requestsRouter from "./routes/requests";
import transportRouter from "./routes/transport";
import aiRouter from "./routes/ai";
import freeRouter from "./routes/free";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.use("/api/requests", requestsRouter);
  app.use("/api", transportRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/free", freeRouter);

  return app;
}
