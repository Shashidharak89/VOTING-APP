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

// Basic routes
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
app.use("/api/auth", authRoutes);
app.use("/api/vote", voteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/position", positionRoutes);

// MongoDB configuration
const mongoUri = process.env.MONGO_URI;

const mongoPoolSize = process.env.MONGO_POOL_SIZE
  ? Number(process.env.MONGO_POOL_SIZE)
  : 10;

if (!mongoUri) {
  console.error("Missing MONGO_URI environment variable");
}

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