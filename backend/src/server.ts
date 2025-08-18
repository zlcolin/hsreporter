import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

import logger from "@/utils/logger";
import app from "./app";

const port = process.env.PORT || 3000;

// In development mode, allow running without complete Redmine configuration
if (process.env.NODE_ENV !== "development") {
  // Validate required environment variables only in production
  const requiredEnvVars = [
    "REDMINE_URL",
    "REDMINE_API_KEY",
    "REDMINE_PROJECT_ID",
  ];
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    logger.error("Missing required environment variables:", { missingEnvVars });
    process.exit(1);
  }
} else {
  // Log warning in development mode if Redmine config is missing
  const requiredEnvVars = [
    "REDMINE_URL",
    "REDMINE_API_KEY",
    "REDMINE_PROJECT_ID",
  ];
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    logger.warn(
      "Running in development mode without complete Redmine configuration:",
      { missingEnvVars }
    );
  }
}

// Start server
const server = app.listen(port, () => {
  logger.info("Server started", {
    port,
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });
});

// Handle server errors
server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  switch (error.code) {
    case "EACCES":
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

export default server;
