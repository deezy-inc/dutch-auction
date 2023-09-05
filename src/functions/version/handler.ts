import { internalServerError } from "@functions/errors";
import { createHttpResponse } from "@libs/api-gateway";

export const getVersion = async () => {
  try {
    return createHttpResponse(200, {
      version: require("./../../../package.json").version,
    });
  } catch (error) {
    console.error(error);
    return internalServerError();
  }
};
