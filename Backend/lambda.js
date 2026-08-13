const serverless = require("serverless-http");
const { app } = require("./server");

const expressHandler = serverless(app);

exports.handler = async (event, context) => {
  // Prevent AWS Lambda from hanging/timing out on open event loop sockets (e.g. Mongoose connection pool)
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    return await expressHandler(event, context);
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