import { useLanguage } from './Language.jsx';
import { Children, Fragment, createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { publicAsset } from './public-assets.js';

export const PageNotice = createContext(null);

function pageActions(children) {
  return Children.toArray(children).flatMap(child => {
    if (child === '') return [];
    return child.type === Fragment ? pageActions(child.props.children) : [child];
  });
}

export function Page({ children, actions, pagination, className = '', label = 'Page content', ...props }) {
  const { t } = useLanguage();
  const notice = useContext(PageNotice);
  const [primary, ...secondary] = pageActions(actions);
  return <section className={`page-screen ${primary ? 'has-page-actions' : ''} ${className}`} {...props}>
    <div className="page-content" role="region" aria-label={t(label)} tabIndex={0}>{notice}{children}</div>
    {primary && <div className="screen-actions page-actions" role="group" aria-label={t("Page actions")}>
      {pagination && <div className="page-pagination-slot">{pagination}</div>}
      <div className="page-primary-action">{primary}</div>
      {secondary.length > 0 && <div className="page-secondary-actions">{secondary}</div>}
    </div>}
  </section>;
}

export function Header({ title = '', onBack, onHelpSelect }) {
  const { t } = useLanguage();
  return <header className="phone-header">
    <div>{onBack && <button type="button" className="back-button" onClick={onBack}><span aria-hidden="true">‹</span>{' '}{t("Back")}</button>}</div>
    <span className="header-title">{t(title)}</span>
    <div className="header-right">{onHelpSelect && <HelpMenu onChoose={onHelpSelect} />}</div>
  </header>;
}

export function SessionMenu({ id, menuRef, onChoose, onKeyDown }) {
  const { t } = useLanguage();
  return <div id={id} ref={menuRef} className="session-menu" role="menu" aria-label={t('Help and session options')} onKeyDown={onKeyDown}>
    <button type="button" role="menuitem" tabIndex={-1} onClick={() => onChoose?.('rules')}>{t('Ground Rules')}</button>
    <button type="button" role="menuitem" tabIndex={-1} onClick={() => onChoose?.('onboarding')}>{t('Onboarding')}</button>
    <button type="button" role="menuitem" tabIndex={-1} onClick={() => onChoose?.('end')}>{t('End Session')}</button>
  </div>;
}

function HelpMenu({ onChoose }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const menu = useRef(null);
  const initialIndex = useRef(0);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelectorAll('[role="menuitem"]')[initialIndex.current]?.focus();
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside, true);
    return () => document.removeEventListener('pointerdown', outside, true);
  }, [open]);
  function close() {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }
  function menuKey(event) {
    const items = Array.from(menu.current.querySelectorAll('[role="menuitem"]'));
    const index = items.indexOf(document.activeElement);
    const next = event.key === 'ArrowDown' ? (index + 1) % items.length
      : event.key === 'ArrowUp' ? (index - 1 + items.length) % items.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : null;
    if (next !== null) { event.preventDefault(); items[next]?.focus(); }
    else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    else if (event.key === 'Tab') close();
  }
  return <div ref={root} className="help-menu" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} type="button" className="help-button" aria-label={t('Open help and session options')} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
      onClick={() => { initialIndex.current = 0; setOpen(value => !value); }}
      onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); initialIndex.current = event.key === 'ArrowUp' ? 2 : 0; setOpen(true); }
        else if (event.key === 'Escape' && open) { event.preventDefault(); close(); }
      }}><span aria-hidden="true">?</span></button>
    {open && <SessionMenu id={menuId} menuRef={menu} onKeyDown={menuKey} onChoose={choice => { close(); onChoose(choice); }} />}
  </div>;
}

export function Action({ children, className = '', ...props }) {
  return <button className={`primary-button ${className}`} type="button" {...props}>{children}</button>;
}

export function ErrorMessage({ children, id }) {
  const { errorText } = useLanguage();
  return children ? <p id={id} className="error-message" role="alert">{errorText(children)}</p> : null;
}

export function Artwork({ name, alt = '', className = '', ...props }) {
  const { t } = useLanguage();
  return <img className={className} src={publicAsset(`assets/${name}`)} alt={t(alt)} decoding="async" {...props} />;
}

export function Dialog({ title, onClose, children, className = '' }) {
  const { t } = useLanguage();
  const ref = useRef(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={ref} className={`native-dialog ${className}`} aria-modal="true" aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); closeRef.current(); }}
    onKeyDown={(event) => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(event.currentTarget.querySelectorAll('button, a[href], input, select, textarea, [tabindex]'))
        .filter((element) => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    }}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeRef.current();
    }}>
    <div className="dialog-top"><button type="button" className="close-button" onClick={onClose} autoFocus><span aria-hidden="true">×</span>{' '}{t("Close")}</button></div>
    <h2 id={titleId}>{t(title)}</h2>
    {children}
  </dialog>;
}

export function GroundRules() {
  const { t } = useLanguage();
  return <div className="ground-rules">
    <div><h3>{t("Keep it fictional.")}</h3><p>{t("Step into the seeded characters’ shoes, rather than using a real disagreement.")}</p></div>
    <div><h3>{t("Curiosity over certainty.")}</h3><p>{t("Keep your words kind. Neither person needs to change their mind.")}</p></div>
    <div><h3>{t("Your pace, your choice.")}</h3><p>{t("Pause, restart, or leave whenever you like. This isn’t counseling or conflict resolution.")}</p></div>
    <div><h3>{t("Just here, just now.")}</h3><p>{t("Drafts stay on your device. A joint session temporarily shares your nickname, avatar, and submitted response with your partner. Ending clears this session. Refreshing cannot restore it. Same-device privacy is a turn-taking convention, not secure storage.")}</p></div>
  </div>;
}

export function EndSessionDialog({ onClose, onEnd, busy = false }) {
  const { t } = useLanguage();
  return <Dialog title={t('Let’s do this another time')} onClose={onClose} className="exit-dialog">
    <Action className="dialog-primary" onClick={onEnd} disabled={busy}>{t(busy ? 'Ending session…' : 'End Session')}</Action>
  </Dialog>;
}
