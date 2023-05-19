const headers = {
  "Access-Control-Allow-Origin": "*", // Update with specific allowed origin(s)
  "Access-Control-Allow-Credentials": true,
};

export function createHttpResponse(statusCode, body) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}

export function createErrorResponse({
  error = {},
  message = "Internal Server Error",
  statusCode = 500,
}) {
  console.error(message, error);
  return createHttpResponse(statusCode, {
    message,
  });
}

export function parseEventInput(event) {
  if (event.body) event.body = JSON.parse(event.body);
}
