import { v4 } from "uuid";

import { isSpent } from "@libs/inscriptions";
import { getAuctionsByInscriptionId, saveAuction } from "@libs/db";
import { createHttpResponse, parseEventInput } from "@libs/api-gateway";

import {
  errorAuctionIsRunning,
  errorAuctionIsSpent,
  errorInvalidInput,
  internalServerError,
} from "@functions/errors";
import { APIGatewayEvent } from "aws-lambda";
import { Auction, AuctionMetadata, AuctionStatus } from "@types";
import { startStateMachine } from "@functions/start-state-machine";
import { CreateAuctionSchema } from "./schema";

function toMilliseconds(timestamp: number) {
  // if timestamp is in seconds
  if (timestamp < 10000000000) {
    return timestamp * 1000;
  }
  // if timestamp is in milliseconds
  else {
    return timestamp;
  }
}

export const createAuction = async (event: APIGatewayEvent) => {
  parseEventInput(event);
  const parsedEventBody = CreateAuctionSchema.safeParse(event.body);
  if (!parsedEventBody.success) {
    console.error(parsedEventBody.error);
    return errorInvalidInput(parsedEventBody.error);
  }

  const {
    startTime: originalStartTime, // IMPORTANT: milliseconds or seconds
    decreaseAmount,
    secondsBetweenEachDecrease, // IMPORTANT: seconds
    initialPrice,
    reservePrice,
    metadata,
    btcAddress,
    inscriptionId,
    output,
    collection,
  } = parsedEventBody.data;

  const startTime = toMilliseconds(originalStartTime);
  const id = v4();
  const now = new Date().getTime();
  const validStartTime = startTime && startTime > now ? startTime : now + 5000; // if the time is invalid use now plus 5 seconds
  const scheduledISODate = new Date(validStartTime).toISOString();

  const auction: Auction = {
    id,
    startTime: validStartTime,
    scheduledISODate,
    decreaseAmount,
    secondsBetweenEachDecrease,
    initialPrice,
    reservePrice,
    metadata: metadata.map((m, index) => {
      const scheduledTime =
        validStartTime + secondsBetweenEachDecrease * 1000 * index;
      return {
        ...(m as {}),
        id: v4(),
        index,
        isLastEvent: index === metadata.length - 1,
        scheduledTime,
        endTime: scheduledTime + secondsBetweenEachDecrease * 1000,
      } as AuctionMetadata;
    }),
    currentPrice: initialPrice,
    status: "PENDING" as AuctionStatus,
    btcAddress,
    inscriptionId,
    output,
    collection,
  };
  try {
    const inscriptionStatus = await isSpent(auction.output);
    if (inscriptionStatus.spent) {
      return errorAuctionIsSpent();
    }
    const auctions = await getAuctionsByInscriptionId(inscriptionId);
    if (auctions.length > 0 && auctions.some((a) => a.status === "RUNNING")) {
      return errorAuctionIsRunning();
    }
    await saveAuction(auction);
    await startStateMachine(auction);
    return createHttpResponse(200, auction);
  } catch (error) {
    console.error("Error in createAuction:", error);
    return internalServerError();
  }
};
