// test.js
// Prove the service is single-use under concurrent consumption.

import assert from "node:assert/strict";
import { issueToken, consumeToken, closeRedis } from "./token-service.js";

async function main() {
  try {
    const id = await issueToken({ userId: 42 }, 60);
    console.log("issued token:", id);

    // All five calls are started together; GETDEL allows only one winner.
    const results = await Promise.all([
      consumeToken(id),
      consumeToken(id),
      consumeToken(id),
      consumeToken(id),
      consumeToken(id),
    ]);

    const winners = results.filter((result) => result.ok).length;
    console.log("winners:", winners);
    assert.equal(winners, 1, "exactly one concurrent consumer must win");
    assert.deepEqual(
      results.filter((result) => result.ok)[0],
      { ok: true, payload: { userId: 42 } },
    );
    assert.equal(results.filter((result) => !result.ok).length, 4);
    console.log("PASS: token was single-use.");
  } finally {
    await closeRedis();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
