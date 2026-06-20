/**
 * @viz-cx/core access with node-failover round-robin (the viz-dice-bot
 * pattern). Isomorphic — used by client islands (validators, account history,
 * live ticker) and by Server Components (block headers) alike.
 *
 * On a transport error, `withNode` rotates to the next endpoint and retries
 * once per remaining node before giving up.
 */
import { createClient, type VizReadClient } from "@viz-cx/core";
import { NODE_ENDPOINTS } from "./config";

let order = [...NODE_ENDPOINTS];
const clients = new Map<string, VizReadClient>();

function clientFor(endpoint: string): VizReadClient {
  let c = clients.get(endpoint);
  if (!c) {
    c = createClient({ endpoint });
    clients.set(endpoint, c);
  }
  return c;
}

/**
 * Run a read against the current node; on failure rotate through the rest.
 * The successful node is promoted to the front for subsequent calls.
 */
export async function withNode<T>(fn: (api: VizReadClient["api"]) => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < order.length; i++) {
    const endpoint = order[i];
    try {
      const result = await fn(clientFor(endpoint).api);
      if (i !== 0) order = [endpoint, ...order.filter((e) => e !== endpoint)];
      return result;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("All VIZ nodes unreachable");
}

export const currentNode = () => order[0];
