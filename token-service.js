// token-service.js
// A single-use, expiring token service backed by Redis.

import crypto from "node:crypto";
import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);
const keyFor = (id) => "token:" + id;

/**
 * Issue a single-use token that expires after ttlSeconds.
 * @param {object} payload Any JSON-serialisable data.
 * @param {number} ttlSeconds Token lifetime in seconds.
 * @returns {Promise<string>} The token id to hand to the user.
 */
export async function issueToken(payload, ttlSeconds) {
  if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new TypeError("ttlSeconds must be a positive integer");
  }

  const value = JSON.stringify(payload);
  if (value === undefined) {
    throw new TypeError("payload must be JSON-serialisable");
  }

  // NX prevents overwriting an existing key in the extraordinarily unlikely
  // event of a random-id collision. EX applies the TTL atomically with SET.
  while (true) {
    const tokenId = crypto.randomBytes(16).toString("hex");
    const stored = await redis.set(keyFor(tokenId), value, "EX", ttlSeconds, "NX");
    if (stored === "OK") return tokenId;
  }
}

/**
 * Consume a token exactly once using Redis' atomic GETDEL command.
 * @param {string} tokenId
 * @returns {Promise<{ ok: true, payload: any } | { ok: false, reason: "invalid" }>}
 */
export async function consumeToken(tokenId) {
  if (typeof tokenId !== "string" || tokenId.length === 0) {
    return { ok: false, reason: "invalid" };
  }

  const value = await redis.getdel(keyFor(tokenId));
  if (value === null) return { ok: false, reason: "invalid" };
  return { ok: true, payload: JSON.parse(value) };
}

// Allow callers/tests to close the Redis connection cleanly.
export function closeRedis() {
  return redis.quit();
}
