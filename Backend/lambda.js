const serverless = require("serverless-http");
const { app } = require("./server");

// Convert Express application into Lambda handler
const expressHandler = serverless(app, {
  binary: [
    "multipart/form-data",
    "image/*",
    "application/octet-stream",
  ],
});

exports.handler = async (event, context) => {
  // Allow Lambda to return without waiting for
  // MongoDB sockets/event-loop handles.
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

    const response = await expressHandler(
      event,
      context
    );

    return response;
  } catch (err) {
    console.error("[Lambda Handler Error]:", err);

    // IMPORTANT:
    // Do NOT add Access-Control-Allow-Origin here.
    // AWS Lambda Function URL is handling CORS.
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Internal Server Error",
        error: err.message,
      }),
    };
  }
};