export function gridFocusIndex(index, count, columns, key, { ctrlKey = false, metaKey = false, altKey = false } = {}) {
  if (![index, count, columns].every(Number.isInteger) || count < 1 || columns < 1 || index < 0 || index >= count || altKey) return null;
  const wholeGrid = ctrlKey || metaKey;
  if (wholeGrid && key !== 'Home' && key !== 'End') return null;
  switch (key) {
    case 'ArrowRight': return Math.min(index + 1, count - 1);
    case 'ArrowLeft': return Math.max(index - 1, 0);
    case 'ArrowDown': return index + columns < count ? index + columns : index;
    case 'ArrowUp': return index - columns >= 0 ? index - columns : index;
    case 'Home': return wholeGrid ? 0 : Math.floor(index / columns) * columns;
    case 'End': return wholeGrid ? count - 1 : Math.min(Math.floor(index / columns) * columns + columns - 1, count - 1);
    default: return null;
  }
}
