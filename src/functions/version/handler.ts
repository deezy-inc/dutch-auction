import { internalServerError } from "@functions/errors";
import { createHttpResponse } from "@libs/api-gateway";

import { Nosft } from "nosft-core";

const nosft = Nosft();

const { getInscription } = nosft.inscriptions;
const { listAuctionInscriptions } = nosft.auction;
const { getNostrBid, getLatestSellNostrInscription } = nosft.nostr;
const { isSpent } = nosft.utxo; // Add isSpent from nosft.utxo

module.exports = {
  getInscription,
  listAuctionInscriptions,
  getNostrBid,
  getLatestSellNostrInscription,
  isSpent,
};

export const getVersion = async () => {
  try {
    return createHttpResponse(200, {
      isSpent: isSpent({
        output:
          "480907a0554a06bc67171d393f6573df167e32f74f60cf56e66c8b84e6dc410d:1",
      }),
      version: require("./../../../package.json").version,
    });
  } catch (error) {
    console.error(error);
    return internalServerError();
  }
};
