// This catalog accepts one fixed public query. Participant data never enters it.
export const COLOR_ENDPOINT = "https://colormind.io/api/";
export const REQUEST_TIMEOUT = 7000;

export function normalizePalette(json) {
  if (
    !Array.isArray(json?.result) ||
    json.result.length < 3 ||
    json.result.length > 12
  ) {
    throw new Error("ColorMind returned an invalid palette.");
  }
  const colors = Array.from(json.result, (rgb) => {
    if (
      !Array.isArray(rgb) ||
      rgb.length !== 3 ||
      !Array.from(rgb).every(
        (number) => Number.isInteger(number) && number >= 0 && number <= 255,
      )
    ) {
      throw new Error("ColorMind returned an invalid RGB color.");
    }
    const value =
      "#" +
      rgb
        .map((number) => number.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
    return { value, label: `Color ${value}`, source: "ColorMind" };
  });
  const distinct = [
    ...new Map(colors.map((color) => [color.value, color])).values(),
  ];
  if (distinct.length < 3) {
    throw new Error(
      "ColorMind returned fewer than three distinct usable colors.",
    );
  }
  return distinct;
}

export async function fetchColors({
  signal,
  timeout = REQUEST_TIMEOUT,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (signal?.aborted) {
    throw (
      signal.reason ??
      new DOMException("Palette request aborted.", "AbortError")
    );
  }
  const controller = new AbortController();
  const abort = () =>
    controller.abort(
      signal.reason ??
        new DOMException("Palette request aborted.", "AbortError"),
    );
  let rejectOnAbort;
  const aborted = new Promise((_resolve, reject) => {
    rejectOnAbort = reject;
  });
  const rejectAborted = () => rejectOnAbort(controller.signal.reason);
  controller.signal.addEventListener("abort", rejectAborted, { once: true });
  signal?.addEventListener("abort", abort, { once: true });
  const duration =
    Number.isFinite(timeout) && timeout >= 0 ? timeout : REQUEST_TIMEOUT;
  const timer = setTimeout(() => {
    controller.abort(
      new DOMException("ColorMind request timed out.", "TimeoutError"),
    );
  }, duration);
  try {
    const request = (async () => {
      const response = await fetchImpl(COLOR_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "text/plain;charset=UTF-8",
        },
        body: '{"model":"default"}',
        signal: controller.signal,
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!response.ok)
        throw new Error(`ColorMind request failed (${response.status}).`);
      return normalizePalette(await response.json());
    })();
    // Bound the whole request, including JSON parsing, even if fetch ignores abort.
    return await Promise.race([request, aborted]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
    controller.signal.removeEventListener("abort", rejectAborted);
  }
}
