const serverless = require("serverless-http");
const { app, connectToDatabase } = require("./server");

const expressHandler = serverless(app);

exports.handler = async (event, context) => {
  await connectToDatabase();

  return expressHandler(event, context);
};