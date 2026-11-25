import { Localized, useLanguage } from '../Language.jsx';
import { useId, useRef } from 'react';
import { Action, Artwork, ErrorMessage, Page } from '../components.jsx';
import { scenarioImages } from '../content.js';
import { localizeScenario, scenarios } from '../data.js';
import { formatScenarioText } from '../scenario-copy.js';
import { canReveal, visibleResponses } from '../session.js';
import SketchPad from '../SketchPad.jsx';
import usePalette from '../usePalette.js';
import Avatar, { AvatarIntro } from '../Avatar.jsx';

function Palette({ value, onChange }) {
  const { t } = useLanguage();
  const { items, status, retry } = usePalette();
  const choices = items.some((item) => item.value === value) ? items : [{ value, label: t('Current ink {color}', { color: value }) }, ...items];
  return <div className="palette">
    <div className="palette-heading"><span className="field-label">{t("Choose an ink color")}</span><span className="palette-source" role="status">{status === 'live' ? t("ColorMind palette") : status === 'loading' ? t("Loading colors · Preset palette") : t("Preset palette · Color service unavailable")}</span></div>
    <div className="palette-options" role="group" aria-label={t("Drawing ink colors")}>{choices.map((item) => <button type="button" key={item.value} className={`color-choice ${item.value === value ? 'is-selected' : ''}`} aria-label={`${t(item.label)}${item.value === value ? t(', selected') : ''}`} aria-pressed={item.value === value} onClick={() => onChange(item.value)}><span style={{ backgroundColor: item.value }} /><span className="color-check" aria-hidden="true">{item.value === value ? '✓' : ''}</span></button>)}</div>
    {status === 'fallback' && <button type="button" className="text-button palette-retry" onClick={retry}>{t("Try loading colors again")}</button>}
  </div>;
}

function Handoff({ name, onReady, joint }) {
  const { t } = useLanguage();
  return <Page className="handoff-screen" label={t("Private handoff")} actions={<Action onClick={onReady}><Localized message="I’m {name} · ready" values={{ name: <span className="handoff-action-name">{name || t('ready')}</span> }} /></Action>}>
    <span className="participant-caption">{t("Private handoff")}</span>
    <Artwork name="welcome.png" className="handoff-art" alt="" />
    <h1>{t('A moment for {name}', { name: name || t('your partner') })}</h1>
    <p>{joint ? t("Your perspective is hidden while you’re away. Continue when you’re ready.") : <Localized message="Pass the device to {name}. Only they should continue." values={{ name: <strong>{name || t('your partner')}</strong> }} />}</p>
    <p className="handoff-note">{t("Your responses stay hidden until both of you have submitted. Take your time.")}</p>
    <p className="field-hint centered">{joint ? t("Your own device · Shared session") : t("One device for this session.")}</p>
  </Page>;
}

function Perspective({ state, active, onNext }) {
  const { t, language } = useLanguage();
  const scenario = localizeScenario(scenarios.find((item) => item.id === state.scenarioId), language);
  if (!scenario) return <PrivateGuard />;
  const name = state.participants[active]?.name || t('Person {number}', { number: active + 1 });
  return <Page className="perspective-screen" label={t("Read your perspective")} actions={<Action onClick={onNext}>{t("Next")}</Action>}>
    <h1>{t("Read your perspective")}</h1>
    <p className="perspective-instructions">{t("Consider what this character notices, feels, wants, and needs in this situation.")}</p>
    <h2 className="small-heading">{t("Scenario setup")}</h2>
    <AvatarIntro participant={state.participants[active]}><p>{formatScenarioText(scenario.story, state.participants)}</p></AvatarIntro>
    <Artwork name={scenarioImages[scenario.id][active]} className="perspective-image" alt={t('An illustration of {scenario} from this character’s point of view.', { scenario: scenario.title.toLowerCase() })} />
    <h2 className="small-heading">{t('{name}’s perspective', { name })}</h2><p className="preserve-lines">{formatScenarioText(scenario.perspectives[active], state.participants)}</p>
  </Page>;
}

function ResponseForm({ state, active, onChange, onSubmit, error, busy }) {
  const { t } = useLanguage();
  const response = visibleResponses(state, 'response', active)[0];
  const textRef = useRef(null);
  const formId = useId();
  if (!response) return <PrivateGuard />;
  if (busy) return <Page role="status"><h1>{t("Submitting your response…")}</h1><p>{t("Waiting for confirmation. Your draft stays on this device until the server receives it.")}</p></Page>;
  const name = state.participants[active].name;
  function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const text = String(values.get('response') ?? response.text);
    onSubmit(text);
  }
  return <Page className={`response-screen ${response.mode === 'draw' ? 'is-drawing' : ''}`} label={t("Your response")} actions={<Action type="submit" form={formId}>{t("Next")}</Action>}>
    <h1>{t("What are your thoughts?")}</h1>
    <AvatarIntro participant={state.participants[active]}>
      <p className="response-prompt">{t('{name}, think about the scenario and your perspective. Write down what you noticed and want to share. Add a drawing if helpful.', { name })}</p>
    </AvatarIntro>
    <div className="response-modes" role="group" aria-label={t("How to respond")}><button type="button" aria-pressed={response.mode === 'write'} className={response.mode === 'write' ? 'is-selected' : ''} onClick={() => onChange({ mode: 'write' })}>{t("My thoughts")}</button><button type="button" aria-pressed={response.mode === 'draw'} className={response.mode === 'draw' ? 'is-selected' : ''} onClick={() => onChange({ mode: 'draw' })}>{t("Draw")}</button></div>
    <form id={formId} onSubmit={submit} noValidate>
      {response.mode === 'draw' && <>
        <Palette value={response.color} onChange={(color) => onChange({ color })} />
        <SketchPad value={response.drawing} color={response.color} onChange={(drawing) => onChange({ drawing })} />
      </>}
      {response.mode === 'write' && <>
        <label className="field-label response-label" htmlFor="response-text">{t("What does this scenario and perspective represent for you?")}</label>
        <textarea ref={textRef} id="response-text" name="response" value={response.text} onChange={(event) => onChange({ text: event.target.value })} maxLength={1200} rows={5} placeholder={t("Write your thoughts here...")} aria-invalid={Boolean(error)} aria-describedby={error ? 'response-error' : undefined} />
      </>}
      {response.mode === 'write' && <div className="response-hints"><span className="character-count" aria-label={t('{count} of 1200 characters', { count: response.text.length })}>{response.text.length}/1200</span></div>}
      <ErrorMessage id="response-error">{error}</ErrorMessage>
    </form>
  </Page>;
}

function ResponseArtwork({ response, name }) {
  const { t } = useLanguage();
  const drawing = typeof response.drawing === 'string' ? response.drawing.trim() : '';
  return <div className={`response-artwork ${drawing ? '' : 'is-empty'}`}>
    {drawing ? <img src={drawing} alt={t('{name}’s drawing', { name })} /> : <div className="empty-drawing"><p>{t('{name} did not create a drawing', { name })}</p></div>}
  </div>;
}

function ResponseText({ response, name }) {
  const { t } = useLanguage();
  const text = typeof response.text === 'string' ? response.text : '';
  return <p className="preserve-lines">{text.trim() ? text : t('{name} did not create a response.', { name })}</p>;
}

function ResponseAuthor({ participant, titleId, own = false }) {
  const { t } = useLanguage();
  return <div className="comparison-author">
    <Avatar avatar={participant.avatar} flushBottom className="comparison-avatar" />
    <h2 id={titleId} className="small-heading">{participant.name}{own && <> <span className="you-label">{t("You")}</span></>}</h2>
  </div>;
}

function Comparison({ state, active, onNext }) {
  const { t } = useLanguage();
  const responses = visibleResponses(state, 'compare', active);
  if (responses.length !== 2 || !canReveal(state)) return <PrivateGuard />;
  const partner = 1 - active;
  const partnerName = state.participants[partner].name;
  const ownName = state.participants[active].name;
  return <Page className="compare-screen" label={t("Compare responses")} actions={<Action onClick={onNext}>{t("Let's Reflect")}</Action>}>
    <h1 className="heading-medium">{t("Compare")}</h1>
    <p className="compare-prompt">{t("Read both responses. Notice where they differ and where they overlap. Discuss the responses with your partner, use the tools on the next screen as prompts for discussion")}</p>
    <article className="partner-response" aria-labelledby="partner-response-title">
      <div className="comparison-visuals">
        <ResponseAuthor participant={state.participants[partner]} titleId="partner-response-title" />
        <ResponseArtwork response={responses[partner]} name={partnerName} />
      </div>
      <ResponseText response={responses[partner]} name={partnerName} />
    </article>
    <article className="own-response" aria-labelledby="own-response-title">
      <div className="comparison-visuals">
        <ResponseAuthor participant={state.participants[active]} titleId="own-response-title" own />
        <ResponseArtwork response={responses[active]} name={ownName} />
      </div>
      <ResponseText response={responses[active]} name={ownName} />
    </article>
  </Page>;
}

function PrivateGuard() {
  const { t } = useLanguage();
  return <Page className="private-guard" role="status"><h1>{t("Responses are still private")}</h1><p>{t("Both people need to submit before the responses can be shared.")}</p></Page>;
}

export default function Conversation({ screen, state, active = 0, onReady, onNext, onChange, onSubmit, error = '', busy = false, joint = false }) {
  if (active !== 0 && active !== 1) return <PrivateGuard />;
  if (screen === 'handoff') return <Handoff name={state.participants[active]?.name} onReady={onReady} joint={joint} />;
  if (screen === 'perspective') return <Perspective state={state} active={active} onNext={onNext} />;
  if (screen === 'response') return <ResponseForm state={state} active={active} onChange={onChange} onSubmit={onSubmit} error={error} busy={busy} />;
  if (screen === 'compare') return <Comparison state={state} active={active} onNext={onNext} />;
  return <PrivateGuard />;
}
