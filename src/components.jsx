import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef } from 'react';
import { publicAsset } from './public-assets.js';

export const PageNotice = createContext(null);

export function Page({ children, actions, className = '', label = 'Page content', ...props }) {
  const notice = useContext(PageNotice);
  const ref = useRef(null);
  const hasActions = Boolean(actions);
  useLayoutEffect(() => {
    const page = ref.current;
    const shell = page?.closest('.app-shell');
    if (!shell) return;
    const footer = page.querySelector(':scope > .page-actions');
    function positionActions() {
      const primary = footer?.querySelector(':scope > .primary-button, :scope > button');
      const start = page.getBoundingClientRect().top - shell.getBoundingClientRect().top;
      const offset = primary ? primary.getBoundingClientRect().top - footer.getBoundingClientRect().top : 0;
      const height = Math.max(0, Math.min(636, 714 - start - offset - 22));
      page.style.setProperty('--page-content-height', `${height}px`);
      page.style.setProperty('--page-actions-gap', `${Math.max(0, 714 - start - offset - height)}px`);
    }
    positionActions();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(positionActions);
    [page, footer, shell.querySelector('.phone-header')].filter(Boolean).forEach(element => observer?.observe(element));
    window.addEventListener('resize', positionActions);
    return () => { observer?.disconnect(); window.removeEventListener('resize', positionActions); };
  }, [hasActions]);
  return <section ref={ref} className={`page-screen ${className}`} {...props}>
    <div className="page-content" role="region" aria-label={label} tabIndex={0}>{notice}{children}</div>
    {actions && <div className="screen-actions page-actions" role="group" aria-label="Page actions">{actions}</div>}
  </section>;
}

export function Header({ title = '', onBack, onHelp }) {
  return <header className="phone-header">
    <div>{onBack && <button type="button" className="back-button" onClick={onBack}><span aria-hidden="true">‹</span> Back</button>}</div>
    <span className="header-title">{title}</span>
    <div className="header-right">{onHelp && <button type="button" className="help-button" aria-label="Open help and session options" onClick={onHelp}><span aria-hidden="true">?</span></button>}</div>
  </header>;
}

export function Action({ children, className = '', ...props }) {
  return <button className={`primary-button ${className}`} type="button" {...props}>{children}</button>;
}

export function ErrorMessage({ children, id }) {
  return children ? <p id={id} className="error-message" role="alert">{children}</p> : null;
}

export function Artwork({ name, alt = '', className = '', ...props }) {
  return <img className={className} src={publicAsset(`assets/${name}`)} alt={alt} decoding="async" {...props} />;
}

export function Dialog({ title, onClose, children, className = '' }) {
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
    <div className="dialog-top"><button type="button" className="close-button" onClick={onClose} autoFocus><span aria-hidden="true">×</span> Close</button></div>
    <h2 id={titleId}>{title}</h2>
    {children}
  </dialog>;
}

export function GroundRules() {
  return <div className="ground-rules">
    <div><h3>Keep it fictional.</h3><p>Step into the seeded characters’ shoes, rather than using a real disagreement.</p></div>
    <div><h3>Curiosity over certainty.</h3><p>Keep your words kind. Neither person needs to change their mind.</p></div>
    <div><h3>Your pace, your choice.</h3><p>Pause, restart, or leave whenever you like. This isn’t counseling or conflict resolution.</p></div>
    <div><h3>Just here, just now.</h3><p>Drafts stay on your device. A joint session temporarily shares your nickname, avatar, and submitted response with your partner. Ending clears this session. Refreshing cannot restore it. Same-device privacy is a turn-taking convention, not secure storage.</p></div>
  </div>;
}
