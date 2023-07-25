import { internalServerError } from "@functions/errors";
import { createHttpResponse, isWarmupRequest } from "@libs/api-gateway";
import { listAuctions } from "@libs/db";
import { APIGatewayEvent } from "aws-lambda";

export const getAuctions = async (event: APIGatewayEvent) => {
  if (isWarmupRequest(event)) return createHttpResponse(200, {});
  try {
    const auctions = await listAuctions();
    return createHttpResponse(200, auctions);
  } catch (error) {
    console.error(error);
    return internalServerError();
  }
};
