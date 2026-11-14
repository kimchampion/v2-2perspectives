// Keep the handoff return decision independent from the private response data.
export function handoffReturnScreen(status, previousScreen) {
  if (status === 'revealed') return 'compare';
  return status === 'responding' && previousScreen === 'response'
    ? 'response'
    : 'perspective';
}
