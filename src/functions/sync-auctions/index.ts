import { handlerPath } from "@libs/handler-resolver";

export const syncAuctions = {
  handler: `${handlerPath(__dirname)}/handler.syncAuctions`,
  events: [
    {
      eventBridge: {
        eventBus: "${self:provider.stage}-notify-auction-changes",
        pattern: {
          source: ["deezy"],
          "detail-type": ["AuctionUpdate"],
        },
      },
    },
  ],
};
