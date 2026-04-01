import "dotenv/config";
import express from "express";
import cors from "cors";
import { initializeDatabase } from "./db";
import { handleDemo } from "./routes/demo";
import requestsRouter from "./routes/requests";
import transportRouter from "./routes/transport";
import aiRouter from "./routes/ai";
import freeRouter from "./routes/free";
import authRouter from "./routes/auth";

export async function createServer() {
  const app = express();

  // Initialize database connection
  try {
    await initializeDatabase();
  } catch (error) {
    console.error("Failed to initialize database:", error);
    // Continue anyway - server can work without DB for some features
  }

  // Middleware
  app.use(
    cors({
      origin: "*",
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Authentication routes
  app.use("/api/auth", authRouter);

  // Other API routes
  app.get("/api/demo", handleDemo);
  app.use("/api/requests", requestsRouter);
  app.use("/api", transportRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/free", freeRouter);

  return app;
}
