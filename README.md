# One-Time Token Service — Starter Scaffold

Build a single-use, expiring token service backed by Redis. The service issues
cryptographically random token IDs, stores JSON payloads with a TTL, and consumes
each token atomically.

## Setup

```bash
npm install
cp .env.example .env      # then set REDIS_URL
docker start redis-m4     # make sure your Redis is running
```

## Implementation

- **`token-service.js`** — `issueToken(payload, ttlSeconds)` uses a random
  128-bit ID and atomic `SET ... EX ... NX`. `consumeToken(tokenId)` uses
  atomic `GETDEL` and returns a typed success/invalid result.
- **`test.js`** — starts five concurrent consumers with `Promise.all`, checks
  the payload and asserts exactly one winner.

## Run the concurrency test

```bash
npm test
```

Expected result (the token ID is random):

```text
issued token: <32-character random hex id>
winners: 1
PASS: token was single-use.
```

The expected winner count is **1**. Run `npm test` with the configured Redis
instance to record the actual output; this environment did not have a live Redis
connection available to verify a runtime result.

## Submit

The pull request contains the completed `token-service.js` and `test.js`,
plus the expected concurrency-test output and the runtime-verification note.
