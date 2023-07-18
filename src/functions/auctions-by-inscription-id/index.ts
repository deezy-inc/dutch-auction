import { handlerPath } from "@libs/handler-resolver";

export const auctionsByInscriptionId = {
  timeout: 30,
  handler: `${handlerPath(__dirname)}/handler.auctionsByInscriptionId`,
  events: [
    {
      http: {
        method: "get",
        path: "/v1/auctions/inscription/{inscriptionId}",
        cors: true,
        request: {
          parameters: {
            paths: {
              inscriptionId: true,
            },
          },
        },
      },
    },
  ],
};
