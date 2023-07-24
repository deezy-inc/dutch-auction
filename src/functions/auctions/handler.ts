import { internalServerError } from "@functions/errors";
import { checkAuctionStatus } from "@functions/shared";
import { createHttpResponse, isWarmupRequest } from "@libs/api-gateway";
import { listAuctions } from "@libs/db";
import { APIGatewayEvent } from "aws-lambda";

export const getAuctions = async (event: APIGatewayEvent) => {
  if (isWarmupRequest(event)) return createHttpResponse(200, {});
  try {
    const auctions = await listAuctions();
    await checkAuctionStatus(auctions);
    return createHttpResponse(200, auctions);
  } catch (error) {
    console.error(error);
    return internalServerError();
  }
};
