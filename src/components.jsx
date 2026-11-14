import { useEffect, useId, useRef } from 'react';

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
  return <img className={className} src={`/assets/${name}`} alt={alt} decoding="async" {...props} />;
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
    <div><h3>Just here, just now.</h3><p>Responses stay in this page’s memory. Refreshing or ending clears them. Same-device privacy is a turn-taking convention, not secure storage.</p></div>
  </div>;
}
