import { useEffect, useId, useRef } from 'react';
import { Action, Artwork, ErrorMessage, Page } from '../components.jsx';
import { onboarding } from '../content.js';

export function Onboarding({ index, onChange, onFinish }) {
  const page = onboarding[index];
  return <Page key={index} className="onboarding-screen" aria-label={`Introduction ${index + 1} of 4`} label={page.title}
    pagination={<nav className="page-dots" aria-label="Introduction pages">{onboarding.map((item, i) => <button type="button" key={item.title} aria-label={`Introduction ${i + 1}: ${item.title}`} aria-current={i === index ? 'step' : undefined} onClick={() => onChange(i)}><span /></button>)}</nav>}
    actions={<>
      <Action onClick={() => index === 3 ? onFinish() : onChange(index + 1)}>Next</Action>
      <button type="button" className="text-button skip-button" onClick={onFinish}>Skip for Now</button>
    </>}>
    <div className="onboarding-hero"><Artwork name={page.image} alt={page.alt} className="onboarding-image" fetchPriority="high" /></div>
    <div className="onboarding-copy"><h1>{page.title}</h1><p>{page.text}</p></div>
  </Page>;
}

export function Welcome({ acknowledged, onAcknowledge, onBegin, error }) {
  const formId = useId();
  const formRef = useRef(null);
  const acknowledgmentRef = useRef(null);
  function showAcknowledgment() {
    acknowledgmentRef.current?.focus();
    formRef.current?.scrollIntoView({ block: 'end' });
  }
  useEffect(() => { if (error) showAcknowledgment(); }, [error]);
  return <Page className="welcome-screen" label="Welcome" actions={<Action type="submit" form={formId}>Let’s Begin</Action>}>
    <h1>One story.<br />Two perspectives.</h1>
    <p className="welcome-description">Conflict isn’t a good or bad thing. Two Perspectives creates an experience for empathy building and discussion.</p>
    <ul className="welcome-details" aria-label="About the experience"><li>2 people</li><li>10–15 minutes</li><li>No right answers</li></ul>
    <Artwork name="welcome.png" className="welcome-art" alt="Two different speech bubbles overlapping." />
    <form id={formId} ref={formRef} onSubmit={(event) => { event.preventDefault(); onBegin(); if (!acknowledged) showAcknowledgment(); }} noValidate>
      <label className="acknowledgment"><input ref={acknowledgmentRef} type="checkbox" checked={acknowledged} onChange={(event) => onAcknowledge(event.target.checked)} aria-describedby={error ? 'welcome-error' : undefined} /><span>We’re here to explore fictional perspectives. This isn’t counseling or conflict resolution.</span></label>
      <ErrorMessage id="welcome-error">{error}</ErrorMessage>
    </form>
  </Page>;
}
