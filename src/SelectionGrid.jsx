import { useId, useRef, useState } from 'react';
import { gridFocusIndex } from './grid-navigation.js';

export default function SelectionGrid({ items, label, columns = 3, selectedId = null, className = '', getLabel, buttonClassName, onActivate, renderOption, opensDialog = false }) {
  const instructionsId = useId();
  const buttons = useRef(new Map());
  const initialId = items.find((item) => item.id === selectedId)?.id ?? items[0]?.id;
  const [focusedId, setFocusedId] = useState(initialId);
  const activeId = items.some((item) => item.id === focusedId) ? focusedId : initialId;
  const columnCount = Number.isInteger(columns) && columns > 0 ? columns : 1;
  const rows = [];
  for (let index = 0; index < items.length; index += columnCount) rows.push(items.slice(index, index + columnCount));

  function keepVisible(button) {
    const bounds = button.getBoundingClientRect();
    for (let parent = button.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      if (parent.scrollHeight <= parent.clientHeight || !['auto', 'scroll'].includes(getComputedStyle(parent).overflowY)) continue;
      if (bounds.height + 16 > parent.clientHeight) {
        parent.scrollTop += bounds.top - parent.getBoundingClientRect().top - 8;
        return;
      }
      break;
    }
    button.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
  }

  function moveFocus(event, index) {
    const next = gridFocusIndex(index, items.length, columnCount, event.key, event);
    if (next === null) return;
    event.preventDefault();
    const item = items[next];
    setFocusedId(item.id);
    const button = buttons.current.get(item.id);
    button?.focus({ preventScroll: true });
  }

  if (!items.length) return null;
  return <>
    <p id={instructionsId} className="sr-only">Use arrow keys to move between options. Home and End move within a row; Control or Command plus Home and End move to the first or last option. Press Enter or Space to choose. Tab and Shift+Tab move to the next or previous control.</p>
    <div className={`selection-grid ${className}`} role="grid" aria-label={label} aria-describedby={instructionsId} aria-rowcount={rows.length} aria-colcount={columnCount} style={{ '--selection-columns': columnCount }}>
      {rows.map((row, rowIndex) => <div key={row[0].id} role="row" aria-rowindex={rowIndex + 1} className="selection-grid-row">
        {row.map((item, columnIndex) => {
          const selected = item.id === selectedId;
          const index = rowIndex * columnCount + columnIndex;
          return <div key={item.id} role="gridcell" aria-colindex={columnIndex + 1} className="selection-grid-cell">
            <button type="button" ref={(node) => { if (node) buttons.current.set(item.id, node); else buttons.current.delete(item.id); }}
              className={buttonClassName?.(item, selected)} aria-label={getLabel?.(item)} aria-pressed={selected} aria-haspopup={opensDialog ? 'dialog' : undefined} tabIndex={item.id === activeId ? 0 : -1}
              onFocus={(event) => { setFocusedId(item.id); keepVisible(event.currentTarget); }} onKeyDown={(event) => moveFocus(event, index)}
              onClick={() => { setFocusedId(item.id); onActivate?.(item); }}>
              {renderOption(item, selected)}
            </button>
          </div>;
        })}
      </div>)}
    </div>
  </>;
}
