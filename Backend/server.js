// File upload middleware
const fileUpload = require("./config/expressFileUpload");

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const app = express();

// ============================================================
// BASIC MIDDLEWARE
// ============================================================

// IMPORTANT:
// CORS is NOT configured here.
// AWS Lambda Function URL handles CORS.

// File uploads
app.use(fileUpload);

// Parse JSON request bodies
app.use(express.json());

// ============================================================
// ROUTES
// ============================================================

const authRoutes = require("./routes/auth");
const voteRoutes = require("./routes/vote");

const adminModule = require("./routes/admin");
const adminRoutes = adminModule.router || adminModule;

const candidateRoutes = require("./routes/candidate");
const positionRoutes = require("./routes/position");

// ============================================================
// MONGODB CONFIGURATION
// ============================================================

const mongoUri = process.env.MONGO_URI;

const mongoPoolSize = process.env.MONGO_POOL_SIZE
  ? Number(process.env.MONGO_POOL_SIZE)
  : 10;

// Reusable connection promise.
// Lambda warm invocations can reuse the MongoDB connection.
let mongoConnectionPromise = null;

async function connectToDatabase() {
  if (!mongoUri) {
    throw new Error("MONGO_URI environment variable is not set");
  }

  // Already connected
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Connection currently being established
  if (mongoose.connection.readyState === 2) {
    if (mongoConnectionPromise) {
      await mongoConnectionPromise;
    }

    return;
  }

  // Connection already in progress
  if (mongoConnectionPromise) {
    await mongoConnectionPromise;
    return;
  }

  console.log("[mongoose] Connecting to MongoDB...");

  mongoConnectionPromise = mongoose
    .connect(mongoUri, {
      maxPoolSize: mongoPoolSize,

      // Force IPv4
      family: 4,

      // MongoDB connection timeout
      serverSelectionTimeoutMS: 10000,

      // Socket timeout
      socketTimeoutMS: 45000,
    })
    .then(() => {
      console.log(
        `[mongoose] Connected successfully. Pool size: ${mongoPoolSize}`
      );
    })
    .catch((err) => {
      console.error(
        "[mongoose] MongoDB connection failed:",
        err.message
      );

      // Allow the next invocation to retry
      mongoConnectionPromise = null;

      throw err;
    });

  await mongoConnectionPromise;
}

// ============================================================
// DATABASE MIDDLEWARE
// ============================================================

async function ensureDbConnected(req, res, next) {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error(
      `[ensureDbConnected] Database error for ${req.method} ${req.originalUrl}:`,
      err.message
    );

    return res.status(500).json({
      message:
        "Database connection error. Please verify MongoDB configuration and Atlas network access.",
    });
  }
}

// ============================================================
// BASIC ROUTES
// ============================================================

// Root
app.get("/", (_req, res) => {
  res.json({
    message: "Voting App API is running",
  });
});

// Health check
// Does NOT require MongoDB
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// STATIC FILES
// ============================================================

app.use("/uploads", express.static("uploads"));

// ============================================================
// API ROUTES
// ============================================================

// Authentication
app.use(
  "/api/auth",
  ensureDbConnected,
  authRoutes
);

// Voting
app.use(
  "/api/vote",
  ensureDbConnected,
  voteRoutes
);

// Admin
//
// POST /api/admin/verify-password
// does NOT require MongoDB.
//
// All other admin routes require MongoDB.
app.use("/api/admin", (req, res, next) => {
  const isPasswordVerification =
    req.method === "POST" &&
    req.path === "/verify-password";

  if (isPasswordVerification) {
    return next();
  }

  return ensureDbConnected(req, res, next);
}, adminRoutes);

// Candidates
app.use(
  "/api/candidate",
  ensureDbConnected,
  candidateRoutes
);

// Positions
app.use(
  "/api/position",
  ensureDbConnected,
  positionRoutes
);

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((err, req, res, _next) => {
  console.error("[Express Global Error]");
  console.error("Method:", req.method);
  console.error("URL:", req.originalUrl);
  console.error("Error:", err);

  if (res.headersSent) {
    return;
  }

  return res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// ============================================================
// MONGOOSE EVENTS
// ============================================================

mongoose.connection.on("error", (err) => {
  console.error(
    "[mongoose] Connection error:",
    err.message
  );
});

mongoose.connection.on("disconnected", () => {
  if (mongoose.connection.readyState === 0) {
    console.warn("[mongoose] MongoDB disconnected");
  }
});

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  app,
  connectToDatabase,
  ensureDbConnected,
};

// ============================================================
// LOCAL DEVELOPMENT
// ============================================================
//
// Runs only when:
// node server.js
//
// Does NOT run when Lambda imports this file.
// ============================================================

if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );
  });

  connectToDatabase().catch((err) => {
    console.error(
      "[local] MongoDB initial connection warning:",
      err.message
    );
  });
}