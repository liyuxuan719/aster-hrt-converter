import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

async function worker({ online = true, ok = true } = {}) {
  const handlers = {}, deleted = [], writes = [];
  const saved = new Map([
    ["https://example.com/aster/guide.html", { body: "guide" }],
    ["./index.html", { body: "app" }],
  ]);
  const context = {
    URL, Response,
    self: { location: { origin: "https://example.com" }, registration: { scope: "https://example.com/aster/" }, clients: { claim() {} },
      skipWaiting() {}, addEventListener(type, fn) { handlers[type] = fn; } },
    caches: { keys: async () => ["aster-hrt-converter-v1.2.0", "aster-hrt-converter-v2.0.0", "veil-v1", "voice-v1"],
      delete: async (key) => deleted.push(key),
      open: async () => ({ addAll: async () => {}, match: async (key) => saved.get(key),
        put: async (key, value) => { writes.push(key); saved.set(key, value); } }) },
    fetch: async () => { if (!online) throw new Error("offline"); return { ok, clone: () => ({ body: "network" }) }; },
  };
  vm.runInNewContext(await readFile(new URL("../sw.js", import.meta.url), "utf8"), context);
  return { handlers, deleted, writes };
}

test("activation keeps other apps' caches on the shared origin", async () => {
  const { handlers, deleted } = await worker();
  let pending; handlers.activate({ waitUntil(promise) { pending = promise; } });
  await pending;
  assert.deepEqual(deleted, ["aster-hrt-converter-v1.2.0"]);
});

test("offline guide returns guide and value query strings are not cache keys", async () => {
  const offline = await worker({ online: false });
  let response;
  offline.handlers.fetch({ request: { method: "GET", mode: "navigate", url: "https://example.com/aster/guide.html?value=123" }, respondWith(promise) { response = promise; } });
  assert.equal((await response).body, "guide");
  const online = await worker();
  online.handlers.fetch({ request: { method: "GET", mode: "navigate", url: "https://example.com/aster/guide.html?value=123" }, respondWith(promise) { response = promise; } });
  await response;
  assert.deepEqual(online.writes, ["https://example.com/aster/guide.html"]);
});

test("failed HTTP navigation cannot poison cached pages", async () => {
  const { handlers, writes } = await worker({ ok: false });
  let response;
  handlers.fetch({ request: { method: "GET", mode: "navigate", url: "https://example.com/aster/guide.html" }, respondWith(promise) { response = promise; } });
  await response;
  assert.deepEqual(writes, []);
});

test("worker leaves sibling projects and external requests alone", async () => {
  const { handlers } = await worker();
  for (const url of ["https://example.com/mira/index.html", "https://external.test/aster/"]) {
    let intercepted = false;
    handlers.fetch({ request: { method: "GET", url }, respondWith() { intercepted = true; } });
    assert.equal(intercepted, false);
  }
});
