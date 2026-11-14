import { useRef, useState } from 'react';
import { Action, Artwork, ErrorMessage } from '../components.jsx';
import AvatarBuilder from '../AvatarBuilder.jsx';
import { AvatarIntro } from '../Avatar.jsx';
import SelectionGrid from '../SelectionGrid.jsx';
import { scenarios } from '../data.js';
import { validateNickname, validateParticipant } from '../session.js';

export function CreatePerson({ participant, otherName, index, onChange, onContinue }) {
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
    <span className="participant-caption">Person {index + 1} of 2</span>
    <h1>Persona</h1>
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

export function JoinPreview({ code, onContinue }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [joining, setJoining] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const joinRef = useRef(null);
  async function copyCode() {
    try { await navigator.clipboard.writeText(code); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  }
  function submit(event) {
    event.preventDefault();
    if (joining && ![code, 'DEMO24'].includes(input.trim().toUpperCase())) {
      setError('That code isn’t available here. Enter the code above or DEMO24 to try this local demonstration.');
      joinRef.current?.focus();
      return;
    }
    onContinue();
  }
  return <div className="join-preview">
    <span className="demo-label">Local demonstration</span>
    <h3>Join your partner’s activity</h3>
    <p>In the connected version, your partner will scan this code to join on their phone.</p>
    <div className="join-code-row"><div><span className="field-label">Your demo code</span><strong className="session-code">{code}</strong><button type="button" className="text-button" onClick={copyCode}>{copied ? 'Code copied ✓' : 'Copy code'}</button></div><div className="qr-preview"><Artwork name="join-preview.png" alt="QR placeholder, not scannable." /></div></div>
    {copyError && <p className="field-hint" role="status">Copy is unavailable. Select the code above to copy it manually.</p>}
    <p className="demo-note">For now, take turns on this device. The code and QR preview do not connect devices.</p>
    <form onSubmit={submit} noValidate>
      {!joining ? <button type="button" className="text-button join-toggle" onClick={() => setJoining(true)}>Have a demo code?</button> : <div className="join-input"><label className="field-label" htmlFor="join-code">Enter a demo code</label><input ref={joinRef} id="join-code" value={input} onChange={(event) => { setInput(event.target.value); setError(''); }} maxLength={6} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="DEMO24" aria-invalid={Boolean(error)} aria-describedby={error ? 'join-error' : undefined} /><ErrorMessage id="join-error">{error}</ErrorMessage></div>}
      <Action type="submit">Continue on this device</Action>
    </form>
  </div>;
}

export function ScenarioPicker({ selected, participant, onSelect, onContinue }) {
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
      <span className="card-category">{scenario.category}</span><strong>{scenario.title}</strong><span className="scenario-description">{scenario.story}</span><Artwork name={`scenario-${scenario.id}.png`} alt="" loading="lazy" />
      <span className="scenario-selection">{chosen ? 'Selected ✓' : 'Select scenario'}</span>
    </>} /> : <p className="empty-state">There are no scenarios available. Please restart the app.</p>}
    <div className="screen-actions"><ErrorMessage>{error}</ErrorMessage><Action onClick={continueToStory}>Continue</Action></div>
  </section>;
}
