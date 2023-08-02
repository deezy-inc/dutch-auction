import { errorInvalidInput } from "@functions/errors";
import {
  createHttpResponse,
  parseEventInput,
  isWarmupRequest,
} from "@libs/api-gateway";

import { signAndBroadcastEvent } from "@libs/nostr";
import { APIGatewayEvent } from "aws-lambda";
import { PublishEventSchema } from "./schema";

export async function publishEvent(event: APIGatewayEvent) {
  if (isWarmupRequest(event)) return createHttpResponse(200, {});
  parseEventInput(event);
  const parsedEventBody = PublishEventSchema.safeParse(event.body);
  if (!parsedEventBody.success) {
    console.error(parsedEventBody.error);
    return errorInvalidInput(parsedEventBody.error);
  }

  const { psbt, output, inscriptionId, currentPrice, type } =
    parsedEventBody.data;

  const { broadcastedEvents, nostr } = await signAndBroadcastEvent({
    pubkey: process.env.NOSTR_PUBLIC_KEY || "",
    privkey: process.env.NOSTR_PRIVATE_KEY || "",
    output: output,
    inscriptionId: inscriptionId,
    priceInSats: currentPrice,
    signedPsbt: psbt,
    type,
  });

  return createHttpResponse(200, {
    broadcastedEvents: broadcastedEvents.filter((event) => event.id !== ""),
    input: parsedEventBody.data,
	nostr
  });
}
