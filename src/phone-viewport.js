// Only editable page fields may temporarily resize the stable small-viewport frame.
// Toolbar expansion/collapse and pinch zoom must not reposition normal actions.
export function keyboardViewport({ editing, stableHeight, height, offsetTop, scale }) {
  if (!editing || scale !== 1 || ![stableHeight, height, offsetTop, scale].every(Number.isFinite)
    || height <= 0 || stableHeight <= 0 || height >= stableHeight - 1) return null;
  return { height, top: Math.max(0, offsetTop) };
}

export function watchPhoneViewport(shell, browser = window) {
  const viewport = browser.visualViewport;
  if (!shell || !viewport) return () => {};
  const document = shell.ownerDocument;
  let frame = null;
  let previousHeight = null;
  let previousField = null;
  function reset() {
    shell.style.removeProperty('--usable-app-height');
    shell.style.removeProperty('--usable-app-top');
    delete shell.dataset.viewportConstrained;
  }
  function update() {
    frame = null;
    const field = document.activeElement;
    const editing = Boolean(field?.closest('.page-content') && !field.closest('dialog')
      && field.matches('textarea, input:not([type]), input[type="text"], input[type="search"], input[type="email"], input[type="tel"], input[type="url"], input[type="password"], input[type="number"], [contenteditable="true"]'));
    // A footer tap can blur the field before its click. Retain the small frame
    // until the viewport grows again so the target does not move mid-gesture.
    const keyboardClosing = previousHeight !== null && !field?.closest('dialog');
    // #root retains the stable small-viewport height even while the shell is fixed
    // above the keyboard. Expanding the live shell to measure would lose scroll.
    const size = keyboardViewport({ editing: editing || keyboardClosing, stableHeight: shell.parentElement.getBoundingClientRect().height,
      height: viewport.height, offsetTop: viewport.offsetTop, scale: viewport.scale });
    if (size) {
      shell.style.setProperty('--usable-app-height', `${size.height}px`);
      shell.style.setProperty('--usable-app-top', `${size.top}px`);
      shell.dataset.viewportConstrained = 'true';
      if (editing && (previousHeight !== size.height || previousField !== field)) field.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    } else reset();
    previousHeight = size?.height ?? null;
    previousField = field;
  }
  function schedule() {
    if (frame === null) frame = browser.requestAnimationFrame(update);
  }
  const listeners = [[viewport, 'resize'], [viewport, 'scroll'], [browser, 'resize'], [document, 'focusin'], [document, 'focusout']];
  listeners.forEach(([target, event]) => target.addEventListener(event, schedule));
  schedule();
  return () => {
    listeners.forEach(([target, event]) => target.removeEventListener(event, schedule));
    if (frame !== null) browser.cancelAnimationFrame(frame);
    reset();
  };
}
