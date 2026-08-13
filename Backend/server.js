// File upload middleware
const fileUpload = require("./config/expressFileUpload");

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(fileUpload);

// CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
    exposedHeaders: ["Content-Length"],
    credentials: false,
    optionsSuccessStatus: 204,
  })
);

app.use(express.json());

const authRoutes = require("./routes/auth");
const voteRoutes = require("./routes/vote");
const adminModule = require("./routes/admin");
const adminRoutes = adminModule.router || adminModule;
const candidateRoutes = require("./routes/candidate");
const positionRoutes = require("./routes/position");

// MongoDB configuration
const mongoUri = process.env.MONGO_URI;

const mongoPoolSize = process.env.MONGO_POOL_SIZE
  ? Number(process.env.MONGO_POOL_SIZE)
  : 10;

// Reusable MongoDB connection promise
let mongoConnectionPromise = null;

async function connectToDatabase() {
  if (!mongoUri) {
    throw new Error("MONGO_URI environment variable is not set");
  }

  // Already connected
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Connection already in progress
  if (mongoConnectionPromise) {
    await mongoConnectionPromise;
    return;
  }

  mongoConnectionPromise = mongoose
    .connect(mongoUri, {
      maxPoolSize: mongoPoolSize,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
    .then(() => {
      console.log(
        `[mongoose] Connected with pool size: ${mongoPoolSize}`
      );
    })
    .catch((err) => {
      mongoConnectionPromise = null;
      console.error("MongoDB connection error:", err.message);
      throw err;
    });

  await mongoConnectionPromise;
}

// Middleware to ensure DB connection for DB-dependent routes
async function ensureDbConnected(req, res, next) {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error("[ensureDbConnected] Database connection error:", err.message);
    res.status(500).json({
      message: "Database connection error. Please verify MONGO_URI and MongoDB Atlas network access.",
      error: err.message,
    });
  }
}

// Basic routes (DB independent)
app.get("/", (req, res) => {
  res.send("Voting App API is running");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Static uploads
app.use("/uploads", express.static("uploads"));

// API routes
// Non-DB routes like /api/admin/verify-password bypass DB connection checks
app.use("/api/auth", ensureDbConnected, authRoutes);
app.use("/api/vote", ensureDbConnected, voteRoutes);
app.use("/api/admin", (req, res, next) => {
  if (req.path === "/verify-password") {
    return next();
  }
  return ensureDbConnected(req, res, next);
}, adminRoutes);
app.use("/api/candidate", ensureDbConnected, candidateRoutes);
app.use("/api/position", ensureDbConnected, positionRoutes);

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error("[Express Global Error]:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// MongoDB event listeners
mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("Mongoose disconnected");
});

// Export Express app and DB connection
module.exports = {
  app,
  connectToDatabase,
  ensureDbConnected,
};

// Keep normal local development working
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  connectToDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to start server:", err);
      process.exit(1);
    });
}