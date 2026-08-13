const serverless = require("serverless-http");
const { app } = require("./server");

// Convert Express application into a Lambda handler
const expressHandler = serverless(app);

exports.handler = async (event, context) => {
  // Important for MongoDB connections.
  //
  // Lambda should be allowed to return the response without
  // waiting for open MongoDB sockets/event-loop handles.
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    console.log(
      "[Lambda] Request:",
      event?.requestContext?.http?.method ||
      event?.httpMethod ||
      "UNKNOWN",
      event?.rawPath ||
      event?.path ||
      "/"
    );

    const response = await expressHandler(event, context);

    return response;
  } catch (err) {
    console.error("[Lambda Handler Error]");
    console.error(err);

    return {
      statusCode: 500,

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        message: "Internal Server Error",
      }),
    };
  }
};