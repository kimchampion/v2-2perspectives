import { useId, useRef } from 'react';
import { Action, Artwork, ErrorMessage, Page } from '../components.jsx';
import { scenarioImages } from '../content.js';
import { scenarios } from '../data.js';
import { formatScenarioText } from '../scenario-copy.js';
import { canReveal, visibleResponses } from '../session.js';
import SketchPad from '../SketchPad.jsx';
import usePalette from '../usePalette.js';
import Avatar, { AvatarIntro } from '../Avatar.jsx';

function Palette({ value, onChange }) {
  const { items, status, retry } = usePalette();
  const choices = items.some((item) => item.value === value) ? items : [{ value, label: `Current ink ${value}` }, ...items];
  return <div className="palette">
    <div className="palette-heading"><span className="field-label">Choose an ink color</span><span className="palette-source" role="status">{status === 'live' ? 'ColorMind palette' : status === 'loading' ? 'Loading colors · Preset palette' : 'Preset palette · Color service unavailable'}</span></div>
    <div className="palette-options" role="group" aria-label="Drawing ink colors">{choices.map((item) => <button type="button" key={item.value} className={`color-choice ${item.value === value ? 'is-selected' : ''}`} aria-label={`${item.label}${item.value === value ? ', selected' : ''}`} aria-pressed={item.value === value} onClick={() => onChange(item.value)}><span style={{ backgroundColor: item.value }} /><span className="color-check" aria-hidden="true">{item.value === value ? '✓' : ''}</span></button>)}</div>
    {status === 'fallback' && <button type="button" className="text-button palette-retry" onClick={retry}>Try loading colors again</button>}
  </div>;
}

function Handoff({ name, onReady, joint }) {
  return <Page className="handoff-screen" label="Private handoff" actions={<Action onClick={onReady}>I’m <span className="handoff-action-name">{name || 'ready'}</span> · ready</Action>}>
    <span className="participant-caption">Private handoff</span>
    <Artwork name="welcome.png" className="handoff-art" alt="" />
    <h1>A moment for {name || 'your partner'}</h1>
    <p>{joint ? 'Your perspective is hidden while you’re away. Continue when you’re ready.' : <>Pass the device to <strong>{name || 'your partner'}</strong>. Only they should continue.</>}</p>
    <p className="handoff-note">Your responses stay hidden until both of you have submitted. Take your time.</p>
    <p className="field-hint centered">{joint ? 'Your own device · Shared session' : 'One device for this session.'}</p>
  </Page>;
}

function Perspective({ state, active, onNext }) {
  const scenario = scenarios.find((item) => item.id === state.scenarioId);
  if (!scenario) return <PrivateGuard />;
  const name = state.participants[active]?.name || `Person ${active + 1}`;
  return <Page className="perspective-screen" label="Read your perspective" actions={<Action onClick={onNext}>Next</Action>}>
    <h1>Read your perspective</h1>
    <p className="perspective-instructions">Consider what this character notices, feels, wants, and needs in this situation.</p>
    <h2 className="small-heading">Scenario setup</h2>
    <AvatarIntro participant={state.participants[active]}><p>{formatScenarioText(scenario.story, state.participants)}</p></AvatarIntro>
    <Artwork name={scenarioImages[scenario.id][active]} className="perspective-image" alt={`An illustration of ${scenario.title.toLowerCase()} from this character’s point of view.`} />
    <h2 className="small-heading">{name}’s perspective</h2><p className="preserve-lines">{formatScenarioText(scenario.perspectives[active], state.participants)}</p>
  </Page>;
}

function ResponseForm({ state, active, onChange, onSubmit, error, busy }) {
  const response = visibleResponses(state, 'response', active)[0];
  const textRef = useRef(null);
  const formId = useId();
  if (!response) return <PrivateGuard />;
  if (busy) return <Page role="status"><h1>Submitting your response…</h1><p>Waiting for confirmation. Your draft stays on this device until the server receives it.</p></Page>;
  const name = state.participants[active].name;
  function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const text = String(values.get('response') || '');
    onSubmit(text);
  }
  return <Page className={`response-screen ${response.mode === 'draw' ? 'is-drawing' : ''}`} label="Your response" actions={response.mode === 'draw' ? <Action onClick={(event) => { event.preventDefault(); onChange({ mode: 'write' }); }}>Next</Action> : <Action type="submit" form={formId}>Submit response</Action>}>
    <h1>What are your thoughts?</h1>
    <AvatarIntro participant={state.participants[active]}>
      <p className="response-prompt">{name}, {response.mode === 'draw' ? 'draw a picture that represents how you feel about what happened.' : 'describe what your drawing represents for you, or share how you feel in words.'}</p>
    </AvatarIntro>
    <div className="response-modes" role="group" aria-label="How to respond"><button type="button" aria-pressed={response.mode === 'draw'} className={response.mode === 'draw' ? 'is-selected' : ''} onClick={() => onChange({ mode: 'draw' })}>Draw</button><button type="button" aria-pressed={response.mode === 'write'} className={response.mode === 'write' ? 'is-selected' : ''} onClick={() => onChange({ mode: 'write' })}>This represents...</button></div>
    <form id={formId} onSubmit={submit} noValidate>
      {response.mode === 'draw' && <>
        <Palette value={response.color} onChange={(color) => onChange({ color })} />
        <SketchPad value={response.drawing} color={response.color} onChange={(drawing) => onChange({ drawing })} />
      </>}
      {response.mode === 'write' && <>
        <label className="field-label response-label" htmlFor="response-text">What does this drawing represent for you?</label>
        <textarea ref={textRef} id="response-text" name="response" value={response.text} onChange={(event) => onChange({ text: event.target.value })} maxLength={1200} rows={5} placeholder="Think about it and write down what the drawing represents to you, or share how you feel in words." aria-invalid={Boolean(error)} aria-describedby={error ? 'response-error' : undefined} />
      </>}
      {response.mode === 'write' && <div className="response-hints"><span className="character-count" aria-label={`${response.text.length} of 1200 characters`}>{response.text.length}/1200</span></div>}
      <ErrorMessage id="response-error">{error}</ErrorMessage>
    </form>
  </Page>;
}

function ResponseArtwork({ response, name }) {
  const drawing = typeof response.drawing === 'string' ? response.drawing.trim() : '';
  return <div className={`response-artwork ${drawing ? '' : 'is-empty'}`}>
    {drawing ? <img src={drawing} alt={`${name}’s drawing`} /> : <div className="empty-drawing"><p>{name} did not create a drawing</p></div>}
  </div>;
}

function ResponseText({ response, name }) {
  const text = typeof response.text === 'string' ? response.text : '';
  return <p className="preserve-lines">{text.trim() ? text : `${name} did not create a response.`}</p>;
}

function ResponseAuthor({ participant, titleId, own = false }) {
  return <div className="comparison-author">
    <Avatar avatar={participant.avatar} flushBottom className="comparison-avatar" />
    <h2 id={titleId} className="small-heading">{participant.name}{own && <> <span className="you-label">You</span></>}</h2>
  </div>;
}

function Comparison({ state, active, onNext }) {
  const responses = visibleResponses(state, 'compare', active);
  if (responses.length !== 2 || !canReveal(state)) return <PrivateGuard />;
  const partner = 1 - active;
  const partnerName = state.participants[partner].name;
  const ownName = state.participants[active].name;
  return <Page className="compare-screen" label="Compare responses" actions={<Action onClick={onNext}>Let's Reflect</Action>}>
    <h1 className="heading-medium">Compare</h1>
    <p className="compare-prompt">Read both responses. Notice where they differ and where they overlap. Discuss the responses with your partner, use the tools on the next screen as prompts for discussion</p>
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
  return <Page className="private-guard" role="status"><h1>Responses are still private</h1><p>Both people need to submit before the responses can be shared.</p></Page>;
}

export default function Conversation({ screen, state, active = 0, onReady, onNext, onChange, onSubmit, error = '', busy = false, joint = false }) {
  if (active !== 0 && active !== 1) return <PrivateGuard />;
  if (screen === 'handoff') return <Handoff name={state.participants[active]?.name} onReady={onReady} joint={joint} />;
  if (screen === 'perspective') return <Perspective state={state} active={active} onNext={onNext} />;
  if (screen === 'response') return <ResponseForm state={state} active={active} onChange={onChange} onSubmit={onSubmit} error={error} busy={busy} />;
  if (screen === 'compare') return <Comparison state={state} active={active} onNext={onNext} />;
  return <PrivateGuard />;
}
