// Maybe we will use this in the future
// import { Queue, QueueOptions } from "bullmq";
// import Redis from "ioredis";

// let redisClient: Redis | null = null;
// let queue: Queue | null = null;

// const auctionsConfig = {
//   name: "Auctions Events",
// };

// const auth =
//   process.env.REDIS_TYPE === "internal"
//     ? {}
//     : { password: process.env.REDIS_PASSWORD };

// const redisConfig = {
//   ...auth,
//   host: process.env.REDIS_HOST,
//   port: parseInt(process.env.REDIS_PORT || "17549"),
// };

// const initServices = async (): Promise<void> => {
//   if (!redisClient) {
//     redisClient = new Redis(redisConfig);
//   }

//   try {
//     const pong = await redisClient.ping("PING");
//     if (pong !== "PONG") {
//       throw new Error("Redis health check failed");
//     }
//   } catch (error) {
//     console.error("Error with Redis:", error);

//     // Reconnect to Redis
//     redisClient = new Redis(redisConfig);
//   }

//   if (!queue) {
//     const queueOpts: QueueOptions = {
//       connection: redisClient,
//     };
//     queue = new Queue(auctionsConfig.name, queueOpts);
//   }
// };

// export const broadcastChange = async () => {
//   try {
//     await initServices();
//     if (!queue) return;
//     await queue.add(auctionsConfig.name, {
//       action: "auction-update",
//     });
//   } catch (error) {
//     console.error("Failed to add job:", error);
//   }
// };
