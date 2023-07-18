import { internalServerError } from "@functions/errors";
import { checkAuctionStatus } from "@functions/shared";
import { createHttpResponse, validateWarm } from "@libs/api-gateway";
import { getAuctionsByInscriptionId } from "@libs/db";
import { APIGatewayEvent } from "aws-lambda";

export const auctionsByInscriptionId = async (event: APIGatewayEvent) => {
  validateWarm(event);
  const inscriptionId = event.pathParameters?.inscriptionId;
  if (!inscriptionId) return internalServerError();
  try {
    const auctions = await getAuctionsByInscriptionId(inscriptionId);
    await checkAuctionStatus(auctions);
    return createHttpResponse(200, auctions);
  } catch (error) {
    console.error(error);
    return internalServerError();
  }
};
