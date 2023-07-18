import { errorInvalidInput } from "@functions/errors";
import {
  createHttpResponse,
  parseEventInput,
  validateWarm,
} from "@libs/api-gateway";

import { signAndBroadcastEvent } from "@libs/nostr";
import { APIGatewayEvent } from "aws-lambda";
import { PublishEventSchema } from "./schema";

export async function publishEvent(event: APIGatewayEvent) {
  validateWarm(event);
  parseEventInput(event);
  const parsedEventBody = PublishEventSchema.safeParse(event.body);
  if (!parsedEventBody.success) {
    console.error(parsedEventBody.error);
    return errorInvalidInput(parsedEventBody.error);
  }

  const { psbt, output, inscriptionId, currentPrice } = parsedEventBody.data;

  const invalidResult = createHttpResponse(200, {
    broadcastedEvents: [],
    input: parsedEventBody.data,
  });

  if (!psbt) {
    return invalidResult;
  }

  const input = {
    pubkey: process.env.NOSTR_PUBLIC_KEY || "",
    privkey: process.env.NOSTR_PRIVATE_KEY || "",
    output: output,
    inscriptionId: inscriptionId,
    priceInSats: currentPrice,
    signedPsbt: psbt,
  };

  let broadcastedEvents = await signAndBroadcastEvent(input);
  broadcastedEvents = broadcastedEvents.filter((event) => event.id !== "");

  return createHttpResponse(200, {
    broadcastedEvents,
    input: parsedEventBody.data,
  });
}
