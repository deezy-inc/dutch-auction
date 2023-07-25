import { internalServerError } from "@functions/errors";
import { createHttpResponse, isWarmupRequest } from "@libs/api-gateway";
import { listAuctions } from "@libs/db";
import { APIGatewayEvent } from "aws-lambda";

export const auctionsByCollection = async (event: APIGatewayEvent) => {
  if (isWarmupRequest(event)) return createHttpResponse(200, {});
  const collection = event.pathParameters?.collection;
  if (!collection) return internalServerError();
  try {
    const auctions = (await listAuctions()).filter(
      (a) => a.collection === collection
    );
    return createHttpResponse(200, auctions);
  } catch (error) {
    console.error(error);
    return internalServerError();
  }
};
