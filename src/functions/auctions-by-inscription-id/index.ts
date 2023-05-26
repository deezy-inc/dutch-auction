import { handlerPath } from "@libs/handler-resolver";

export const auctionsByInscriptionId = {
  handler: `${handlerPath(__dirname)}/handler.auctionsByInscriptionId`,
  events: [
    {
      http: {
        method: "get",
        path: "/inscription/{inscriptionId}",
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