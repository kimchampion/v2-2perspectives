import { useEffect, useId, useRef, useState } from 'react';
import { Action, Artwork, ErrorMessage, Page } from '../components.jsx';
import AvatarBuilder from '../AvatarBuilder.jsx';
import { AvatarIntro } from '../Avatar.jsx';
import SelectionGrid from '../SelectionGrid.jsx';
import { scenarios } from '../data.js';
import { formatScenarioText } from '../scenario-copy.js';
import { normalizeSessionCode, validateNickname, validateParticipant } from '../session.js';

export function CreatePerson({ participant, otherName, onChange, onContinue }) {
  const [error, setError] = useState('');
  const nicknameRef = useRef(null);
  const formId = useId();
  const nameError = participant.name.trim() ? validateNickname(participant.name, otherName) : '';
  const issue = validateParticipant(participant, otherName);
  const continueHint = participant.name.trim() ? issue : '';
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = { name: String(form.get('nickname') || '').trim(), avatar: participant.avatar };
    const issue = validateParticipant(values, otherName);
    if (issue) { setError(issue); nicknameRef.current?.focus(); return; }
    setError('');
    onContinue(values);
  }
  return <Page className="person-screen" label="Create your avatar" actions={<Action type="submit" form={formId} disabled={Boolean(issue)} aria-describedby={continueHint ? 'person-continue-hint' : undefined}>Continue</Action>}>
    <h1>Create your avatar</h1>
    <p>Create an avatar that feels like you.</p>
    <form id={formId} onSubmit={submit} noValidate>
      <label className="field-label" htmlFor="nickname">Name or nickname</label>
      <input id="nickname" name="nickname" ref={nicknameRef} value={participant.name} onChange={(event) => { setError(''); onChange({ name: event.target.value }); }} placeholder="Enter your name or nickname" autoComplete="nickname" autoCapitalize="words" maxLength={30} aria-invalid={Boolean(error || nameError)} aria-describedby={error || nameError ? 'person-error' : 'nickname-hint'} />
      <span id="nickname-hint" className="sr-only">Choose a nickname different from your partner’s. Maximum 30 characters.</span>
      <ErrorMessage id="person-error">{error || nameError}</ErrorMessage>
      <AvatarBuilder avatar={participant.avatar} onChange={(avatar) => { setError(''); onChange({ avatar }); }} />
      {continueHint && <p id="person-continue-hint" className="field-hint">{continueHint}</p>}
    </form>
  </Page>;
}

export function SessionChoices({ pending = false, waiting = false, error = '', onCreate, onJoin, onLocal }) {
  const createRef = useRef(null);
  const errorId = useId();
  useEffect(() => { if (error && !pending) createRef.current?.focus(); }, [error, pending]);
  return <Page className="session-choice-screen" label="Choose how to begin">
    <h1>How would you like to begin?</h1>
    <div className="session-choice-options">
      <div className="session-choice-row">
        <div><h2>Start the game as the first participant.</h2><p>Share a code with your partner</p></div>
        <Action ref={createRef} onClick={onCreate} disabled={pending} aria-busy={pending} aria-describedby={error ? errorId : undefined}>{pending ? 'Creating session…' : 'Create Session'}</Action>
      </div>
      <div className="session-choice-row">
        <div><h2>Game already started? Join your partner’s session.</h2><p>Use separate devices and share a code with your partner</p></div>
        <Action onClick={onJoin}>Join Session</Action>
      </div>
      <div className="session-choice-row">
        <div><h2>Only one Device?</h2><p>You and your partner want to take turns on a single device? No session code required</p></div>
        <Action onClick={onLocal}>Shared Device</Action>
      </div>
    </div>
    {pending && waiting && <p className="field-hint session-choice-status" role="status">The session server may be waking up. This can take about a minute. You can keep waiting or choose Shared Device.</p>}
    <ErrorMessage id={errorId}>{error}</ErrorMessage>
  </Page>;
}

export function SessionInvitation({ code, onContinue }) {
  const sessionCode = normalizeSessionCode(code);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  async function copyCode() {
    try { await navigator.clipboard.writeText(sessionCode); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  }
  return <Page className="session-invitation-screen" label="Your session code" actions={<Action onClick={onContinue} disabled={!sessionCode}>Build your persona</Action>}>
    <h1>Your session is ready</h1>
    <p>Share this code with your partner. You can both build your personas next.</p>
    <div className="join-code-row"><div><span className="field-label">Session Code</span><strong className="session-code">{sessionCode || 'Session code unavailable'}</strong><button type="button" className="text-button" onClick={copyCode} disabled={!sessionCode}>{copied ? 'Code copied ✓' : 'Copy code'}</button></div></div>
    {copyError && <p className="field-hint" role="status">Copy is unavailable. Select the code above to copy it manually.</p>}
  </Page>;
}

export function JoinCodeForm({ onJoin, initialCode = '' }) {
  const [code, setCode] = useState(() => normalizeSessionCode(initialCode));
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const id = useId();
  return <form className="join-code-form" noValidate onSubmit={event => {
    event.preventDefault();
    const value = normalizeSessionCode(code);
    if (!value) { setError('Enter the six-character code shared by your partner.'); inputRef.current?.focus(); return; }
    onJoin?.(value);
  }}>
    <p>Use the code your partner shared to join their activity on this device.</p>
    <label className="field-label" htmlFor={id}>Enter session code</label>
    <input ref={inputRef} id={id} value={code} maxLength={6} onChange={event => { setCode(event.target.value); setError(''); }} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="6-character code" aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
    <ErrorMessage id={`${id}-error`}>{error}</ErrorMessage>
    <Action type="submit" className="dialog-primary">Continue</Action>
  </form>;
}

export function JointStatus({ code, session, connection, error, slow, onRetry, onLeave, onChooseScenario }) {
  const connected = connection === 'connected';
  const own = session?.participantIndex ?? 0;
  const partner = session?.participants?.[1 - own];
  const submitted = session?.phase === 'responding' && session?.participants?.[own]?.submitted;
  const ready = connected && session?.phase === 'lobby' && session.participants.every(person => person?.connected);
  return <Page className="joint-status-screen" label="Joint session status" actions={<>
    {error && <Action onClick={onRetry}>Try reconnecting</Action>}
    {ready && own === 0 && <Action onClick={onChooseScenario}>Choose a scenario</Action>}
    <button type="button" className="text-button" onClick={onLeave}>{connected ? 'End session' : 'Return to start'}</button>
  </>}>
    <h1>{error ? 'Let’s reconnect' : !connected ? 'Connecting your session' : submitted ? 'Your response is ready' : 'Your shared session'}</h1>
    <p role={error ? 'alert' : 'status'}>{error || (!connected ? slow ? 'The session server may be waking up. This can take about a minute.' : 'Connecting to the session server…' : submitted ? `Waiting for ${partner?.name || 'your partner'} to submit. Both responses will be revealed together.` : own === 0 ? 'Share this code with your partner. You can choose a scenario when both of you are connected.' : `Waiting for ${partner?.name || 'your partner'} to choose a scenario.`)}</p>
    <div className="joint-session-code"><span className="field-label">Session Code</span><strong className="session-code">{session?.code || code}</strong></div>
    {session && <ul className="joint-participants" aria-label="Participants">{session.participants.map((person, index) => <li key={index}><strong>{person?.name || `Person ${index + 1}`}{index === own ? ' · You' : ''}</strong><span>{!person ? 'Not joined yet' : person.connected ? person.submitted ? 'Response submitted' : 'Connected' : 'Reconnecting'}</span></li>)}</ul>}
    {error && <p className="field-hint">If the server restarted, this session may have ended. Refreshing cannot restore a session; your draft stays in this page until you leave.</p>}
  </Page>;
}

export function ScenarioPicker({ selected, participant, participants, onSelect, onContinue }) {
  const [error, setError] = useState('');
  const errorRef = useRef(null);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  function continueToStory() {
    if (!selected) { setError('Select a scenario to continue.'); errorRef.current?.focus(); return; }
    setError(''); onContinue();
  }
  return <Page className="scenario-screen" label="Choose a scenario" actions={<Action onClick={continueToStory} disabled={!selected}>Continue</Action>}>
    <h1>Choose a scenario</h1>
    <AvatarIntro participant={participant}>
      <p>Hi {participant?.name}!</p>
      <p>Choose a situation to explore with your partner.</p>
      <p className="field-hint">Select one scenario to continue.</p>
    </AvatarIntro>
    <div ref={errorRef} tabIndex={-1}><ErrorMessage>{error}</ErrorMessage></div>
    {scenarios.length ? <SelectionGrid className="scenario-rail" label="Fictional scenarios" columns={scenarios.length} items={scenarios} selectedId={selected} scrollOnPointerFocus={false}
      buttonClassName={(_scenario, chosen) => `scenario-card ${chosen ? 'is-selected' : ''}`} onActivate={(scenario) => { setError(''); onSelect(scenario.id); }} renderOption={(scenario) => <>
      <span className="card-category">{scenario.category}</span><strong>{scenario.title}</strong><span className="scenario-description">{formatScenarioText(scenario.cardDescription ?? scenario.story, participants)}</span><Artwork name={scenario.image ?? `scenario-${scenario.id}.png`} alt="" loading="lazy" />
    </>} /> : <p className="empty-state">There are no scenarios available. Please restart the app.</p>}
  </Page>;
}
