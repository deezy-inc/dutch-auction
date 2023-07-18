import { APIGatewayEvent } from "aws-lambda";

const headers = {
  "Access-Control-Allow-Origin": "*", // Update with specific allowed origin(s)
  "Access-Control-Allow-Credentials": true,
};

export function createHttpResponse(statusCode: number, body: object) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}

export const validateWarm = (event: APIGatewayEvent) => {
  if (event.headers && event.headers["deezy-ignore"]) {
    console.log("Ignoring request...");
    return { statusCode: 200 };
  }
};

export function createErrorResponse({
  error = {},
  message = "Internal Server Error.",
  statusCode = 500,
}) {
  console.error(message, error);
  return createHttpResponse(statusCode, {
    message,
  });
}

export function parseEventInput(event: any) {
  if (event.body) event.body = JSON.parse(event.body);
}
