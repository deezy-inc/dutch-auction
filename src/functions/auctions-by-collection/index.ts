import { handlerPath } from "@libs/handler-resolver";

export const auctionsByCollection = {
  timeout: 30,
  handler: `${handlerPath(__dirname)}/handler.auctionsByCollection`,
  events: [
    {
      http: {
        method: "get",
        path: "/v1/auctions/collection/{collection}",
        cors: true,
        request: {
          parameters: {
            paths: {
              collection: true,
            },
          },
        },
      },
    },
  ],
};
