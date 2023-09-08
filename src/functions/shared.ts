import { updateAuctionStatus } from "@libs/db";
import { isSpent } from "@libs/inscriptions";
import { Auction } from "@types";

export const checkAuctionStatus = async (auctions: Auction[]) => {
  for (let i = 0; i < auctions.length; i++) {
    const auction = auctions[i];
    const inscriptionStatus = await isSpent(auction.output);
    // always update the auction status if it is spent
    if (inscriptionStatus.spent && auction.status !== "SPENT") {
      await updateAuctionStatus(auction.id, "SPENT");
      auctions[i] = { ...auction, status: "SPENT" };
    }
  }
};
