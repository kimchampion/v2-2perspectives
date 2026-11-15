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

export function SessionStartActions({ pending = false, error = '', onCreate, onLocal }) {
  const retryRef = useRef(null);
  const errorId = useId();
  useEffect(() => { if (error && !pending) retryRef.current?.focus(); }, [error, pending]);
  return <div className="dialog-actions">
    <ErrorMessage id={errorId}>{error}</ErrorMessage>
    <Action ref={retryRef} onClick={onCreate} disabled={pending} aria-busy={pending} aria-describedby={error ? errorId : undefined}>{pending ? 'Creating session…' : error ? 'Try again' : 'I agree · continue'}</Action>
    {error && <button type="button" className="outline-button" onClick={onLocal}>Continue on this device</button>}
  </div>;
}

export function JoinPreview({ code, codeSource = 'server', onContinue }) {
  const local = codeSource === 'local';
  const sessionCode = normalizeSessionCode(code);
  const jointHintId = useId();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [joining, setJoining] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const joinRef = useRef(null);
  async function copyCode() {
    try { await navigator.clipboard.writeText(sessionCode); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  }
  function submit(event) {
    event.preventDefault();
    if (!sessionCode) { setError('A session code is unavailable. Go back and create a session.'); return; }
    if (!local && joining && normalizeSessionCode(input) !== sessionCode) {
      setError('That code doesn’t match this session. Enter the session code shown above.');
      joinRef.current?.focus();
      return;
    }
    onContinue();
  }
  return <div className="join-preview">
    <p>{local ? 'You’re continuing on one device. This local demo code does not connect devices.' : 'Share this code with other player so they can join the session.'}</p>
    <div className="join-code-row"><div><span className="field-label">{local ? 'Local demo code' : 'Session Code'}</span><strong className="session-code">{sessionCode || 'Session code unavailable'}</strong><button type="button" className="text-button" onClick={copyCode} disabled={!sessionCode}>{copied ? 'Code copied ✓' : 'Copy code'}</button></div></div>
    {copyError && <p className="field-hint" role="status">Copy is unavailable. Select the code above to copy it manually.</p>}
    <form onSubmit={submit} noValidate>
      {!local && (!joining ? <button type="button" className="text-button join-toggle" onClick={() => setJoining(true)}>Have a session code?</button> : <div className="join-input"><label className="field-label" htmlFor="join-code">Enter session code</label><input ref={joinRef} id="join-code" value={input} onChange={(event) => { setInput(event.target.value); setError(''); }} maxLength={6} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="6-character code" aria-invalid={Boolean(error)} aria-describedby={error ? 'join-error' : undefined} /><ErrorMessage id="join-error">{error}</ErrorMessage></div>)}
      <div className="dialog-actions">
        <span className="sr-only" id={jointHintId}>Joint sessions are coming soon.</span>
        <Action disabled aria-describedby={jointHintId} title="Joint sessions are coming soon.">Enter joint session</Action>
        <button type="submit" className="outline-button" disabled={!sessionCode}>Continue on this device</button>
      </div>
    </form>
  </div>;
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
