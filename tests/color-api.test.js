import test from "node:test";
import assert from "node:assert/strict";
import * as api from "../src/color-api.js";
const rgb = [
  [0, 15, 255],
  [200, 100, 50],
  [255, 255, 255],
];
const response = (result = rgb) => ({
  ok: true,
  json: async () => ({ result }),
});
function implementation(name) {
  assert.equal(typeof api[name], "function", `${name} must be implemented`);
  return api[name];
}

test("palette normalization returns distinct uppercase labeled ColorMind colors", () => {
  const normalize = implementation("normalizePalette");
  assert.deepEqual(normalize({ result: [...rgb, rgb[0]] }), [
    { value: "#000FFF", label: "Color #000FFF", source: "ColorMind" },
    { value: "#C86432", label: "Color #C86432", source: "ColorMind" },
    { value: "#FFFFFF", label: "Color #FFFFFF", source: "ColorMind" },
  ]);
});

test("palette normalization rejects malformed RGB, invalid counts, and fewer than three distinct colors", () => {
  const normalize = implementation("normalizePalette");
  const invalid = [
    null,
    {},
    { result: null },
    { result: [] },
    { result: rgb.slice(0, 2) },
    { result: Array.from({ length: 13 }, () => rgb[0]) },
    { result: [rgb[0], rgb[1], rgb[0]] },
    { result: [rgb[0], rgb[0], rgb[0]] },
    ...[
      null,
      {},
      [1, 2],
      [1, 2, 3, 4],
      Array(3),
      ["1", 2, 3],
      [1.5, 2, 3],
      [NaN, 2, 3],
      [Infinity, 2, 3],
      [-1, 2, 3],
      [256, 2, 3],
    ].map((bad) => ({ result: [rgb[0], rgb[1], bad] })),
  ];
  for (const value of invalid)
    assert.throws(() => normalize(value), /invalid|usable|distinct/i);
});

test("ColorMind uses only the fixed public query and omits credentials and referrer", async () => {
  const fetchColors = implementation("fetchColors");
  assert.equal(api.COLOR_ENDPOINT, "https://colormind.io/api/");
  assert.equal(api.REQUEST_TIMEOUT, 7000);
  const calls = [];
  const colors = await fetchColors({
    fetchImpl: async (...args) => {
      calls.push(args);
      return response();
    },
    // Extra caller fields must never become request data or override privacy options.
    endpoint: "https://private.example/upload",
    body: "private response",
    model: "private nickname",
    credentials: "include",
    headers: { Authorization: "secret" },
  });
  assert.equal(calls.length, 1);
  const [url, options] = calls[0];
  assert.equal(url, api.COLOR_ENDPOINT);
  assert.deepEqual(Object.keys(options).sort(), [
    "body",
    "credentials",
    "headers",
    "method",
    "referrerPolicy",
    "signal",
  ]);
  assert.equal(options.method, "POST");
  assert.equal(options.body, '{"model":"default"}');
  assert.equal(options.credentials, "omit");
  assert.equal(options.referrerPolicy, "no-referrer");
  assert.deepEqual(options.headers, {
    Accept: "application/json",
    "Content-Type": "text/plain;charset=UTF-8",
  });
  assert.ok(options.signal instanceof AbortSignal);
  assert.deepEqual(colors, api.normalizePalette({ result: rgb }));
});

test("ColorMind rejects HTTP failures, invalid JSON, network errors, and unusable palettes without retrying", async () => {
  const fetchColors = implementation("fetchColors");
  for (const fetchResult of [
    async () => ({
      ok: false,
      status: 503,
      json: () => assert.fail("HTTP error body is not parsed"),
    }),
    async () => ({
      ok: true,
      json: async () => {
        throw new SyntaxError("invalid JSON");
      },
    }),
    async () => {
      throw new TypeError("network unavailable");
    },
    async () => response([rgb[0], rgb[0], rgb[0]]),
  ]) {
    let count = 0;
    await assert.rejects(
      fetchColors({
        fetchImpl: (...args) => {
          count++;
          return fetchResult(...args);
        },
      }),
    );
    assert.equal(count, 1);
  }
});

test("timeout aborts a pending fetch even if the fetch implementation ignores abort", async () => {
  const fetchColors = implementation("fetchColors");
  let requestSignal;
  await assert.rejects(
    fetchColors({
      timeout: 10,
      fetchImpl: async (_url, options) => {
        requestSignal = options.signal;
        return new Promise(() => {});
      },
    }),
    { name: "TimeoutError" },
  );
  assert.equal(requestSignal.aborted, true);
});

test("timeout also bounds parsing a response body", async () => {
  const fetchColors = implementation("fetchColors");
  await assert.rejects(
    fetchColors({
      timeout: 10,
      fetchImpl: async () => ({
        ok: true,
        json: () => new Promise(() => {}),
      }),
    }),
    { name: "TimeoutError" },
  );
});

test("external abort cancels the active request without retrying", async () => {
  const fetchColors = implementation("fetchColors");
  const controller = new AbortController();
  let requestSignal;
  let calls = 0;
  const pending = fetchColors({
    signal: controller.signal,
    fetchImpl: async (_url, options) => {
      calls++;
      requestSignal = options.signal;
      return new Promise(() => {});
    },
  });
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  assert.equal(requestSignal.aborted, true);
  assert.equal(calls, 1);
});

test("an already aborted request never contacts the catalog", async () => {
  const fetchColors = implementation("fetchColors");
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    fetchColors({
      signal: controller.signal,
      fetchImpl: () => assert.fail("pre-aborted request must not fetch"),
    }),
    { name: "AbortError" },
  );
});

test("settled requests clean their external listener and timeout", async () => {
  const fetchColors = implementation("fetchColors");
  for (const fail of [false, true]) {
    const controller = new AbortController();
    const added = [];
    const removed = [];
    const signal = {
      get aborted() {
        return controller.signal.aborted;
      },
      addEventListener: (...args) => {
        added.push(args);
        controller.signal.addEventListener(...args);
      },
      removeEventListener: (...args) => {
        removed.push(args);
        controller.signal.removeEventListener(...args);
      },
    };
    let requestSignal;
    const pending = fetchColors({
      signal,
      timeout: 15,
      fetchImpl: async (_url, options) => {
        requestSignal = options.signal;
        if (fail) throw new Error("network unavailable");
        return response();
      },
    });
    if (fail) await assert.rejects(pending);
    else await pending;
    assert.equal(added.length, 1);
    assert.equal(removed.length, 1);
    assert.equal(added[0][1], removed[0][1]);
    await new Promise((resolve) => setTimeout(resolve, 25));
    assert.equal(
      requestSignal.aborted,
      false,
      "settled request timeout was cleared",
    );
    controller.abort();
    assert.equal(
      requestSignal.aborted,
      false,
      "settled request external listener was removed",
    );
  }
});
