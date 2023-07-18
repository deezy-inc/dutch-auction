import { handlerPath } from "@libs/handler-resolver";

export const publishEvent = {
  timeout: 30,
  handler: `${handlerPath(__dirname)}/handler.publishEvent`,
  events: [
    {
      http: {
        method: "post",
        path: "/v1/nostr",
        cors: true,
      },
    },
  ],
};
