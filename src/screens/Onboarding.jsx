import { LanguageChoice, useLanguage } from '../Language.jsx';
import { useEffect, useId, useRef } from 'react';
import { Action, Artwork, ErrorMessage, Page } from '../components.jsx';
import { onboarding } from '../content.js';

export function Onboarding({ index, onChange, onFinish }) {
  const { t } = useLanguage();
  const page = onboarding[index];
  return <Page key={index} className="onboarding-screen" aria-label={t('Introduction {number} of 4', { number: index + 1 })} label={page.title}
    pagination={<nav className="page-dots" aria-label={t("Introduction pages")}>{onboarding.map((item, i) => <button type="button" key={item.title} aria-label={t('Introduction {number}: {title}', { number: i + 1, title: t(item.title) })} aria-current={i === index ? 'step' : undefined} onClick={() => onChange(i)}><span /></button>)}</nav>}
    actions={<>
      <Action onClick={() => index === 3 ? onFinish() : onChange(index + 1)}>{t("Next")}</Action>
      <button type="button" className="text-button skip-button" onClick={onFinish}>{t("Skip for Now")}</button>
    </>}>
    <div className="onboarding-hero"><Artwork name={page.image} alt={page.alt} className="onboarding-image" fetchPriority="high" /></div>
    <div className="onboarding-copy"><h1>{t(page.title)}</h1><p>{t(page.text)}</p></div>
  </Page>;
}

export function Welcome({ acknowledged, onAcknowledge, onBegin, error }) {
  const { t } = useLanguage();
  const formId = useId();
  const formRef = useRef(null);
  const acknowledgmentRef = useRef(null);
  function showAcknowledgment() {
    acknowledgmentRef.current?.focus();
    formRef.current?.scrollIntoView({ block: 'end' });
  }
  useEffect(() => { if (error) showAcknowledgment(); }, [error]);
  return <Page className="welcome-screen" label={t("Welcome")} actions={<Action type="submit" form={formId}>{t("Let’s Begin")}</Action>}>
    <h1>{t("One story.")}<br />{t("Two perspectives.")}</h1>
    <LanguageChoice />
    <p className="welcome-description">{t("Conflict isn’t a good or bad thing. Two Perspectives creates an experience for empathy building and discussion.")}</p>
    <ul className="welcome-details" aria-label={t("About the experience")}><li>{t("2 people")}</li><li>{t("10–15 minutes")}</li><li>{t("No right answers")}</li></ul>
    <Artwork name="welcome.png" className="welcome-art" alt={t("Two different speech bubbles overlapping.")} />
    <form id={formId} ref={formRef} onSubmit={(event) => { event.preventDefault(); onBegin(); if (!acknowledged) showAcknowledgment(); }} noValidate>
      <label className="acknowledgment"><input ref={acknowledgmentRef} type="checkbox" checked={acknowledged} onChange={(event) => onAcknowledge(event.target.checked)} aria-describedby={error ? 'welcome-error' : undefined} /><span>{t("We’re here to explore fictional perspectives. This isn’t counseling or conflict resolution.")}</span></label>
      <ErrorMessage id="welcome-error">{error}</ErrorMessage>
    </form>
  </Page>;
}
