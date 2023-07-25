import { internalServerError } from "@functions/errors";
import { createHttpResponse, isWarmupRequest } from "@libs/api-gateway";
import { getAuctionsByInscriptionId } from "@libs/db";
import { APIGatewayEvent } from "aws-lambda";

export const auctionsByInscriptionId = async (event: APIGatewayEvent) => {
  if (isWarmupRequest(event)) return createHttpResponse(200, {});
  const inscriptionId = event.pathParameters?.inscriptionId;
  if (!inscriptionId) return internalServerError();
  try {
    const auctions = await getAuctionsByInscriptionId(inscriptionId);
    return createHttpResponse(200, auctions);
  } catch (error) {
    console.error(error);
    return internalServerError();
  }
};
