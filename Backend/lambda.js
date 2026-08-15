const serverless = require("serverless-http");
const { app } = require("./server");

// Convert Express application into a Lambda handler with binary payload support
const expressHandler = serverless(app, {
  binary: [
    "multipart/form-data",
    "image/*",
    "application/octet-stream",
  ],
});

exports.handler = async (event, context) => {
  // Important for MongoDB connection pooling on AWS Lambda.
  // Allows Lambda to return response immediately without waiting for open sockets.
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const method =
      event?.requestContext?.http?.method ||
      event?.httpMethod ||
      "UNKNOWN";
    const path =
      event?.rawPath ||
      event?.path ||
      "/";

    console.log(`[Lambda] ${method} ${path}`);

    const response = await expressHandler(event, context);
    return response;
  } catch (err) {
    console.error("[Lambda Handler Error]:", err);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
      },
      body: JSON.stringify({
        message: "Internal Server Error",
        error: err.message,
      }),
    };
  }
};