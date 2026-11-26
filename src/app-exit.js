export function requestAppClose(close = () => globalThis.window?.close()) {
  try { close(); }
  catch { /* The cleared end screen remains available for manual closing. */ }
}

export async function exitApp({ endSharedSession, clearLocal, close, signal }) {
  if (signal?.aborted) return false;
  let sharedEndConfirmed = true;
  try { await endSharedSession?.(signal); }
  catch (error) {
    if (error?.name === 'AbortError') return false;
    sharedEndConfirmed = false;
  }
  // A canceled acknowledgement must never clear a newer activity.
  if (signal?.aborted) return false;
  clearLocal({ sharedEndConfirmed });
  requestAppClose(close);
  return true;
}
