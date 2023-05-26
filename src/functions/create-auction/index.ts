import schema from "./schema";
import { handlerPath } from "@libs/handler-resolver";

export const createAuction = {
  handler: `${handlerPath(__dirname)}/handler.createAuction`,
  events: [
    {
      http: {
        method: "post",
        path: "create",
        request: {
          schemas: {
            "application/json": schema,
          },
        },
      },
    },
  ],
};
