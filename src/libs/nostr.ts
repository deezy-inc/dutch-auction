import "websocket-polyfill";
import { getEventHash, relayInit, Event, getSignature } from "nostr-tools";

const NOSTR_KIND_INSCRIPTION = 802;
const RELAYS = [
  "wss://relay.deezy.io",
  "wss://nostr-pub.wellorder.net",
  "wss://nostr.bitcoiner.social",
  "wss://relay.damus.io",
  "wss://nostr.openordex.org",
];

type NostrType = "sell" | "buy";

interface SellEventParams {
  inscriptionId: string;
  output: string;
  networkName?: string;
  priceInSats: number;
  signedPsbt: string;
  type?: NostrType;
  pubkey: string;
}

interface SignedEvent extends Event {
  id: string;
  sig: string;
}

// Function to sign Nostr events
async function sign(
  event: Omit<Event, "sig">,
  privkey: string
): Promise<SignedEvent> {
  const eventBase = { ...event, created_at: Math.floor(Date.now() / 1000) };
  const newEvent = { ...eventBase, id: getEventHash(eventBase) };
  const sig = getSignature(newEvent, privkey);

  return { ...newEvent, sig };
}

// Function to construct the sell event
function formatNostrEvent({
  inscriptionId,
  output,
  networkName = "mainnet",
  priceInSats,
  signedPsbt,
  type = "sell",
  pubkey,
}: SellEventParams) {
  const event = {
    kind: NOSTR_KIND_INSCRIPTION,
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["n", networkName], // Network name (e.g. "mainnet", "signet")
      ["t", type], // Type of order (e.g. "sell", "buy")
      ["i", inscriptionId], // Inscription ID
      ["u", output], // Inscription UTXO
      ["s", priceInSats.toString()], // Price in sats
      ["x", "deezy"], // Exchange name (e.g. "openordex")
    ],
    content: signedPsbt,
  };
  return {
    ...event,
    id: getEventHash(event),
  };
}

// Function to sign Nostr event
async function signNostrEvent({
  privkey,
  ...nostrProps
}: SellEventParams & { privkey: string }): Promise<SignedEvent> {
  const event = formatNostrEvent({
    ...nostrProps,
  });
  const signedEvent = await sign(event, privkey);

  return signedEvent;
}

type PublishedEvent = {
  id: string;
};

// Function to sign and broadcast Nostr event
async function signAndBroadcastEvent({
  inscriptionId,
  priceInSats,
  ...nostrProps
}: SellEventParams & { privkey: string }) {
  try {
    const signedEvent = await signNostrEvent({
      inscriptionId,
      priceInSats,
      ...nostrProps,
    });

    console.log("signedEvent:", JSON.stringify(signedEvent, null, 2));
    const events = await publishEvent(signedEvent);
    return {
      broadcastedEvents: events,
      nostr: { ...signedEvent, value: priceInSats, inscriptionId },
    };
  } catch (error) {
    console.error("An error occurred in signAndBroadcastEvent", error);
    return { broadcastedEvents: [], nostr: null };
  }
}

// Function to publish the event to the Nostr network
const publishEvent = async (event: Event) => {
  console.info(`Processing ${event.id}`);

  const promises = RELAYS.map(
    (url) =>
      new Promise((resolve, reject) => {
        try {
          const relay = relayInit(url);
          const timeout = 10000;

          const timeoutAndClose = () => {
            console.error(`Timeout error: event ${event.id} relay ${url}`);
            relay.close();
            resolve({ id: "", url });
          };

          let timeoutCheck = setTimeout(timeoutAndClose, timeout);

          relay.on("connect", () => {
            console.info(`Sending ${event.id} to ${url}`, event);

            const pub = relay.publish(event);

            pub.on("ok", () => {
              console.info(`Event ${event.id} published to ${url}`);
              relay.close();
              clearTimeout(timeoutCheck);
              resolve({ id: event.id, url });
            });

            pub.on("failed", (reason: Error) => {
              console.warn(
                `Failed to publish ${event.id} to ${url}: ${reason}`
              );
              relay.close();
              clearTimeout(timeoutCheck);
              resolve({ id: "", url });
            });
          });

          relay.on("error", () => {
            console.error(`Failed to connect to ${url}`);
            clearTimeout(timeoutCheck);
            relay.close();
            resolve({ id: "", url });
          });

          relay.connect().catch((error) => {
            console.error("An error occurred in relay.connect", url);
            reject(error);
          });
        } catch (error) {
          console.error("Failed to publish", error);
          reject(error); // This will handle any error that is not already handled
        }
      })
  );

  try {
    const results = await Promise.allSettled(promises);

    const events: PublishedEvent[] = results
      .filter((result) => result.status === "fulfilled")
      .map(
        (result) => (result as PromiseFulfilledResult<PublishedEvent>).value
      );

    console.log("events", events);
    return events;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export { signAndBroadcastEvent, publishEvent };
