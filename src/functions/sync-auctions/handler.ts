import axios from "axios";
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
const client = new EventBridgeClient({ region: "us-east-1" });

export async function notifyNostrService() {
  const params = {
    Entries: [
      {
        EventBusName: "notify-auction-changes",
        Source: "deezy",
        DetailType: "AuctionUpdate",
        Detail: JSON.stringify({}),
      },
    ],
  };
  try {
    const command = new PutEventsCommand(params);
    const data = await client.send(command);
    console.log("Event sent: ", data);
  } catch (error) {
    console.log("An error occurred: ", error);
  }
}

export async function syncAuctions() {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log("[SYNC AUCTIONS]");
      await axios.get(`https://nostr-service.deezy.place/api/v1/auctions/sync`);
      console.log("[SYNC AUCTIONS][COMPLETE]");
      return; // Success, so exit the function
    } catch (error) {
      retries++;
      console.error(`[SYNC AUCTIONS][ERROR][Attempt ${retries}]`, error);
    }
  }

  console.error("[SYNC AUCTIONS][FAILED] Exceeded maximum number of retries");
}
