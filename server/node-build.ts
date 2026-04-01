import path from "path";
import { createServer } from "./index";
import * as express from "express";

const __dirname = import.meta.dirname;

const startServer = async () => {
  const app = await createServer();
  const PORT = process.env.PORT || 8080;

  const distPath = path.join(__dirname, "../spa");

  app.use(express.static(distPath));

  app.get(/.*/, (req, res) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }

    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Fusion Starter server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/api`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth/login`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
