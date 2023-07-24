import { internalServerError } from "@functions/errors";
import { checkAuctionStatus } from "@functions/shared";
import { createHttpResponse, validateWarm } from "@libs/api-gateway";
import { getAuctionsByNostrAddress } from "@libs/db";
import { APIGatewayEvent } from "aws-lambda";

export const getAuctionsByAddress = async (event: APIGatewayEvent) => {
  const ignoreResponse = validateWarm(event);
  if (ignoreResponse) return ignoreResponse;
  const address = event.pathParameters?.address;
  try {
    if (!address) throw new Error("No address provided");
    const auctions = await getAuctionsByNostrAddress(address);
    await checkAuctionStatus(auctions);
    return createHttpResponse(200, auctions);
  } catch (error) {
    console.error(error);
    return internalServerError();
  }
};
