import { useEffect, useId, useRef, useState } from 'react';
import { Action, Artwork, ErrorMessage } from '../components.jsx';
import AvatarBuilder from '../AvatarBuilder.jsx';
import { AvatarIntro } from '../Avatar.jsx';
import SelectionGrid from '../SelectionGrid.jsx';
import { scenarios } from '../data.js';
import { formatScenarioText } from '../scenario-copy.js';
import { normalizeSessionCode, validateNickname, validateParticipant } from '../session.js';

export function CreatePerson({ participant, otherName, onChange, onContinue }) {
  const [error, setError] = useState('');
  const nicknameRef = useRef(null);
  const nameError = participant.name.trim() ? validateNickname(participant.name, otherName) : '';
  const issue = validateParticipant(participant, otherName);
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = { name: String(form.get('nickname') || '').trim(), avatar: participant.avatar };
    const issue = validateParticipant(values, otherName);
    if (issue) { setError(issue); nicknameRef.current?.focus(); return; }
    setError('');
    onContinue(values);
  }
  return <section className="person-screen">
    <h1>Build your persona</h1>
    <p>Create an avatar that feels like you.</p>
    <form onSubmit={submit} noValidate>
      <label className="field-label" htmlFor="nickname">Name or nickname</label>
      <input id="nickname" name="nickname" ref={nicknameRef} value={participant.name} onChange={(event) => { setError(''); onChange({ name: event.target.value }); }} placeholder="Enter your name or nickname" autoComplete="nickname" autoCapitalize="words" maxLength={30} aria-invalid={Boolean(error || nameError)} aria-describedby={error || nameError ? 'person-error' : 'nickname-hint'} />
      <span id="nickname-hint" className="sr-only">Choose a nickname different from your partner’s. Maximum 30 characters.</span>
      <ErrorMessage id="person-error">{error || nameError}</ErrorMessage>
      <AvatarBuilder avatar={participant.avatar} onChange={(avatar) => { setError(''); onChange({ avatar }); }} />
      <div className="person-actions">
        {issue && <p id="person-continue-hint" className="field-hint">{!participant.name.trim() ? 'Enter a nickname and choose an avatar option to continue.' : issue}</p>}
        <Action type="submit" disabled={Boolean(issue)} aria-describedby={issue ? 'person-continue-hint' : undefined}>Continue</Action>
      </div>
    </form>
  </section>;
}

export function SessionChoices({ pending = false, waiting = false, error = '', onCreate, onJoin, onLocal }) {
  const createRef = useRef(null);
  const errorId = useId();
  useEffect(() => { if (error && !pending) createRef.current?.focus(); }, [error, pending]);
  return <section className="session-choice-screen">
    <h1>How would you like to begin?</h1>
    <p>Choose how you and your partner will take part.</p>
    {pending && waiting && <p className="field-hint" role="status">The session server may be waking up. This can take about a minute. You can keep waiting or use one device.</p>}
    <ErrorMessage id={errorId}>{error}</ErrorMessage>
    <div className="session-choice-actions">
      <div><Action ref={createRef} onClick={onCreate} disabled={pending} aria-busy={pending} aria-describedby={error ? errorId : undefined}>{pending ? 'Creating session…' : 'Create a session'}</Action><p className="field-hint">Use separate devices and share a code with your partner.</p></div>
      <div><button type="button" className="outline-button" onClick={onJoin}>Join a session</button><p className="field-hint">Use a code your partner shared with you.</p></div>
      <div><button type="button" className="outline-button" onClick={onLocal}>Use one device</button><p className="field-hint">Take turns on one device. No code needed.</p></div>
    </div>
  </section>;
}

export function SessionInvitation({ code, onContinue }) {
  const sessionCode = normalizeSessionCode(code);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  async function copyCode() {
    try { await navigator.clipboard.writeText(sessionCode); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  }
  return <section className="session-invitation-screen">
    <h1>Your session is ready</h1>
    <p>Share this code with your partner. You can both build your personas next.</p>
    <div className="join-code-row"><div><span className="field-label">Session Code</span><strong className="session-code">{sessionCode || 'Session code unavailable'}</strong><button type="button" className="text-button" onClick={copyCode} disabled={!sessionCode}>{copied ? 'Code copied ✓' : 'Copy code'}</button></div></div>
    {copyError && <p className="field-hint" role="status">Copy is unavailable. Select the code above to copy it manually.</p>}
    <div className="screen-actions"><Action onClick={onContinue} disabled={!sessionCode}>Build your persona</Action></div>
  </section>;
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
  return <section className="joint-status-screen">
    <h1>{error ? 'Let’s reconnect' : !connected ? 'Connecting your session' : submitted ? 'Your response is ready' : 'Your shared session'}</h1>
    <p role={error ? 'alert' : 'status'}>{error || (!connected ? slow ? 'The session server may be waking up. This can take about a minute.' : 'Connecting to the session server…' : submitted ? `Waiting for ${partner?.name || 'your partner'} to submit. Both responses will be revealed together.` : own === 0 ? 'Share this code with your partner. You can choose a scenario when both of you are connected.' : `Waiting for ${partner?.name || 'your partner'} to choose a scenario.`)}</p>
    <div className="joint-session-code"><span className="field-label">Session Code</span><strong className="session-code">{session?.code || code}</strong></div>
    {session && <ul className="joint-participants" aria-label="Participants">{session.participants.map((person, index) => <li key={index}><strong>{person?.name || `Person ${index + 1}`}{index === own ? ' · You' : ''}</strong><span>{!person ? 'Not joined yet' : person.connected ? person.submitted ? 'Response submitted' : 'Connected' : 'Reconnecting'}</span></li>)}</ul>}
    {error && <p className="field-hint">If the server restarted, this session may have ended. Refreshing cannot restore a session; your draft stays in this page until you leave.</p>}
    <div className="screen-actions">
      {error && <Action onClick={onRetry}>Try reconnecting</Action>}
      {ready && own === 0 && <Action onClick={onChooseScenario}>Choose a scenario</Action>}
      <button type="button" className="text-button" onClick={onLeave}>{connected ? 'End session' : 'Return to start'}</button>
    </div>
  </section>;
}

export function ScenarioPicker({ selected, participant, participants, onSelect, onContinue }) {
  const [error, setError] = useState('');
  function continueToStory() {
    if (!selected) { setError('Select a scenario to continue.'); return; }
    setError(''); onContinue();
  }
  return <section className="scenario-screen">
    <h1>Choose a scenario</h1>
    <AvatarIntro participant={participant}>
      <p>Hi {participant?.name}!</p>
      <p>Choose a situation to explore with your partner. Each of you will describe what happened from your character’s perspective.</p>
      <p className="field-hint">Select one scenario to continue.</p>
    </AvatarIntro>
    {scenarios.length ? <SelectionGrid className="scenario-rail" label="Fictional scenarios" columns={scenarios.length} items={scenarios} selectedId={selected}
      buttonClassName={(_scenario, chosen) => `scenario-card ${chosen ? 'is-selected' : ''}`} onActivate={(scenario) => { setError(''); onSelect(scenario.id); }} renderOption={(scenario, chosen) => <>
      <span className="card-category">{scenario.category}</span><strong>{scenario.title}</strong><span className="scenario-description">{formatScenarioText(scenario.cardDescription ?? scenario.story, participants)}</span><Artwork name={scenario.image ?? `scenario-${scenario.id}.png`} alt="" loading="lazy" />
      <span className="scenario-selection">{chosen ? 'Selected ✓' : 'Select scenario'}</span>
    </>} /> : <p className="empty-state">There are no scenarios available. Please restart the app.</p>}
    <div className="screen-actions"><ErrorMessage>{error}</ErrorMessage><Action onClick={continueToStory}>Continue</Action></div>
  </section>;
}
