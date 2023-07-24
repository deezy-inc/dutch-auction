import { internalServerError } from "@functions/errors";
import { checkAuctionStatus } from "@functions/shared";
import { createHttpResponse, validateWarm } from "@libs/api-gateway";
import { listAuctions } from "@libs/db";
import { APIGatewayEvent } from "aws-lambda";

export const auctionsByCollection = async (event: APIGatewayEvent) => {
  const ignoreResponse = validateWarm(event);
  if (ignoreResponse) return ignoreResponse;
  const collection = event.pathParameters?.collection;
  if (!collection) return internalServerError();
  try {
    const auctions = (await listAuctions()).filter(
      (a) => a.collection === collection
    );
    await checkAuctionStatus(auctions);
    return createHttpResponse(200, auctions);
  } catch (error) {
    console.error(error);
    return internalServerError();
  }
};
