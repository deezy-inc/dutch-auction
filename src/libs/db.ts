import { Auction, AuctionId, AuctionMetadata, AuctionStatus } from "@types";

import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

const client = DynamoDBDocument.from(new DynamoDB({}), {
  marshallOptions: { removeUndefinedValues: true, convertEmptyValues: true },
});

function removeUndefinedValues(obj: any) {
  for (let k in obj) {
    if (obj[k] === undefined) {
      delete obj[k];
    } else if (typeof obj[k] === "object" && obj[k] !== null) {
      removeUndefinedValues(obj[k]);
    }
  }
}

const getAuctionsByNostrAddress = async (btcAddress: string) => {
  console.log(`btcAddress: ${btcAddress}, type: ${typeof btcAddress}`);
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    IndexName: "btcAddress-index",
    KeyConditionExpression: "#na = :na",
    ExpressionAttributeNames: {
      "#na": "btcAddress",
    },
    ExpressionAttributeValues: {
      ":na": btcAddress,
    },
  };

  try {
    const { Items } = await client.query(params);
    return Items as Auction[];
  } catch (error) {
    console.error(`Error getting auctions by btcAddress: ${error}`);
    throw error;
  }
};

const getAuctionsByCollection = async (collection: string) => {
  console.log(`collection: ${collection}, type: ${typeof collection}`);
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    IndexName: "collection-index",
    KeyConditionExpression: "#na = :na",
    ExpressionAttributeNames: {
      "#na": "collection",
    },
    ExpressionAttributeValues: {
      ":na": collection,
    },
  };

  try {
    const { Items } = await client.query(params);
    return Items as Auction[];
  } catch (error) {
    console.error(`Error getting auctions by Collection: ${error}`);
    throw error;
  }
};

const getAuctionsByInscriptionId = async (
  inscriptionId: string
): Promise<Auction[]> => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    IndexName: "inscriptionId-index",
    KeyConditionExpression: "#na = :na",
    ExpressionAttributeNames: {
      "#na": "inscriptionId",
    },
    ExpressionAttributeValues: {
      ":na": inscriptionId,
    },
  };
  try {
    const { Items } = await client.query(params);
    return Items as Auction[];
  } catch (error) {
    console.error(`Error getting auctions by btcAddress: ${error}`);
    throw error;
  }
};

const saveAuction = async (auction: Auction) => {
  removeUndefinedValues(auction);
  if (typeof auction.btcAddress !== "string") {
    throw new Error("btcAddress must be a string");
  }
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: auction,
  };

  try {
    await client.put(params);
  } catch (error) {
    console.error(`Error saving auction: ${error}`);
    throw error;
  }
};

const listAuctions = async () => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
  };

  try {
    const { Items } = await client.scan(params);
    return Items as Auction[];
  } catch (error) {
    console.error(`Error listing auctions: ${error}`);
    throw error;
  }
};

const getAuction = async (auctionId: string) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      id: auctionId,
    },
  };

  try {
    const { Item } = await client.get(params);
    return Item as Auction;
  } catch (error) {
    console.error(`Error getting auction: ${error}`);
    throw error;
  }
};

const finishAuction = async (auctionId: AuctionId, status?: string) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: { id: auctionId },
    UpdateExpression: "set #status = :status",
    ExpressionAttributeValues: {
      ":status": status || "FINISHED",
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
  };

  try {
    await client.update(params);
    return { status: "FINISHED" };
  } catch (error) {
    console.error(`Error finishing auction: ${error}`);
    throw error;
  }
};

const updateAuctionStatus = async (
  auctionId: AuctionId,
  status: AuctionStatus
) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      id: auctionId,
    },
    UpdateExpression: "SET #status = :status",
    ExpressionAttributeValues: {
      ":status": status,
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
  };

  try {
    await client.update(params);
  } catch (error) {
    console.error(`Error updating auction status: ${error}`);
    throw error;
  }
};

const updateAuctionMetadata = async (
  auctionId: AuctionId,
  metadata: AuctionMetadata[]
) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      id: auctionId,
    },
    UpdateExpression: "SET metadata = :metadata, #status = :status",
    ExpressionAttributeValues: {
      ":metadata": metadata,
      ":status": "RUNNING",
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
  };

  try {
    await client.update(params);
  } catch (error) {
    console.error(`Error updating auction status: ${error}`);
    throw error;
  }
};

const updateAuctionPrice = async (auctionId: AuctionId, price: number) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      id: auctionId,
    },
    UpdateExpression: "SET currentPrice = :currentPrice",
    ExpressionAttributeValues: {
      ":currentPrice": price,
    },
  };

  try {
    await client.update(params);
  } catch (error) {
    console.error(`Error updating auction price: ${error}`);
    throw error;
  }
};

const deleteAuctionsByInscriptionId = async (inscriptionId: string) => {
  const auctions = await getAuctionsByInscriptionId(inscriptionId);

  const ids = auctions.map((auction) => auction.id);

  const deletePromises = auctions.map((auction) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        id: { S: auction.id },
      },
    };
    const command = new DeleteItemCommand(params);
    return client.send(command);
  });

  try {
    await Promise.all(deletePromises);
    console.log(
      `Deleted ${auctions.length} records with inscriptionId: ${inscriptionId}`
    );
    return ids;
  } catch (error) {
    console.error(`Error deleting auctions by inscriptionId: ${error}`);
    throw error;
  }
};

const deleteAuctionById = async (auctionId: string) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      id: { S: auctionId },
    },
  };
  const command = new DeleteItemCommand(params);
  try {
    await client.send(command);
    console.log(`Deleted record with auctionId: ${auctionId}`);
  } catch (error) {
    console.error(`Error deleting auction by auctionId: ${error}`);
    throw error;
  }
};

export {
  saveAuction,
  getAuction,
  updateAuctionStatus,
  updateAuctionMetadata,
  updateAuctionPrice,
  getAuctionsByNostrAddress,
  getAuctionsByCollection,
  getAuctionsByInscriptionId,
  listAuctions,
  finishAuction,
  deleteAuctionsByInscriptionId,
  deleteAuctionById,
};
