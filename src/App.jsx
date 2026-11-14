import { useEffect, useReducer, useRef, useState } from 'react';
import { Action, Artwork, Dialog, GroundRules, Header } from './components.jsx';
import { reflectionPaths } from './content.js';
import { createSessionState, newSessionCode, sessionReducer, validateResponse } from './session.js';
import { handoffReturnScreen } from './navigation.js';
import { Onboarding, Welcome } from './screens/Onboarding.jsx';
import { CreatePerson, JoinPreview, ScenarioPicker } from './screens/Setup.jsx';
import Conversation from './screens/Conversation.jsx';
import Reflection, { ReflectionPrompt } from './screens/Reflection.jsx';

export default function App() {
  const [state, dispatch] = useReducer(sessionReducer, undefined, () => createSessionState(newSessionCode()));
  const [screen, setScreen] = useState('onboarding');
  const [onboardingIndex, setOnboardingIndex] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [welcomeError, setWelcomeError] = useState('');
  const [active, setActive] = useState(0);
  const [setupIndex, setSetupIndex] = useState(0);
  const [modal, setModal] = useState(null);
  const [responseError, setResponseError] = useState('');
  const [resumeScreen, setResumeScreen] = useState('perspective');
  const mainRef = useRef(null);
  const privateView = ['handoff', 'perspective', 'response'].includes(screen);
  const inSession = ['person', 'scenario', 'handoff', 'perspective', 'response', 'compare', 'reflection'].includes(screen);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    mainRef.current?.focus({ preventScroll: true });
  }, [screen, active, setupIndex, onboardingIndex]);

  // A hidden page returns to a handoff; no draft is exposed on resume.
  useEffect(() => {
    if (!privateView || screen === 'handoff') return;
    const conceal = () => {
      if (document.visibilityState === 'hidden') { setResumeScreen(screen); setScreen('handoff'); setResponseError(''); setModal(null); }
    };
    document.addEventListener('visibilitychange', conceal);
    return () => document.removeEventListener('visibilitychange', conceal);
  }, [privateView, screen]);

  function begin() {
    if (!acknowledged) { setWelcomeError('Please acknowledge the note before beginning.'); return; }
    setWelcomeError(''); setModal({ kind: 'rules', begin: true });
  }
  function acceptRules() {
    dispatch({ type: 'RESET', code: newSessionCode() });
    setSetupIndex(0); setActive(0); setModal(null); setScreen('person');
  }
  function continuePerson(values) {
    dispatch({ type: 'SET_PARTICIPANT', participant: setupIndex, values });
    if (setupIndex === 0) setModal({ kind: 'join' });
    else setScreen('scenario');
  }
  function startResponses() {
    dispatch({ type: 'START_RESPONSES' });
    setActive(0); setResponseError(''); setResumeScreen('perspective'); setScreen('handoff');
  }
  function updateResponse(values) {
    setResponseError(''); dispatch({ type: 'UPDATE_RESPONSE', participant: active, values });
  }
  function submitResponse(text) {
    const response = { ...state.responses[active], text };
    const issue = validateResponse(response);
    if (issue) { setResponseError(issue); document.getElementById('response-text')?.focus(); return; }
    dispatch({ type: 'UPDATE_RESPONSE', participant: active, values: { text } });
    dispatch({ type: 'SUBMIT_RESPONSE', participant: active });
    setResponseError(''); setResumeScreen('perspective');
    if (state.responses[1 - active].submitted) { setActive(0); setScreen('compare'); }
    else { setActive(1 - active); setScreen('handoff'); }
  }
  function compareNext() {
    if (active === 0) setActive(1);
    else setScreen('reflection');
  }
  function clearSession(destination) {
    const participants = state.participants.map((participant) => ({ ...participant }));
    dispatch({ type: destination === 'ended' ? 'END' : 'RESET', code: newSessionCode() });
    if (destination === 'scenario') participants.forEach((values, participant) => dispatch({ type: 'SET_PARTICIPANT', participant, values }));
    setResponseError(''); setWelcomeError(''); setResumeScreen('perspective'); setModal(null); setActive(0); setSetupIndex(0);
    if (destination === 'welcome') setAcknowledged(false);
    setScreen(destination);
  }
  function goBack() {
    setResponseError('');
    if (screen === 'welcome') { setOnboardingIndex(3); setScreen('onboarding'); }
    else if (screen === 'person' && setupIndex === 1) setSetupIndex(0);
    else if (screen === 'person') setScreen('welcome');
    else if (screen === 'scenario') { setSetupIndex(1); setScreen('person'); }
    else if (screen === 'response') setScreen('perspective');
    else if (screen === 'perspective') { setResumeScreen('perspective'); setScreen('handoff'); }
    else if (screen === 'compare' && active === 1) setActive(0);
    else if (screen === 'compare') setScreen('perspective');
    else if (screen === 'reflection') { setActive(1); setScreen('compare'); }
  }
  function handoffReady() {
    setScreen(handoffReturnScreen(state.status, resumeScreen));
    setResumeScreen('perspective');
  }
  const title = privateView && screen !== 'handoff' ? 'Your Perspective' : ['compare', 'reflection'].includes(screen) ? 'Discussion' : '';
  const chosenPath = modal?.kind === 'reflection' && reflectionPaths.find((path) => path.id === modal.path);
  const body = screen === 'onboarding' ? <Onboarding index={onboardingIndex} onChange={setOnboardingIndex} onFinish={() => setScreen('welcome')} />
    : screen === 'welcome' ? <Welcome acknowledged={acknowledged} onAcknowledge={(value) => { setAcknowledged(value); setWelcomeError(''); }} onBegin={begin} error={welcomeError} />
    : screen === 'person' ? <CreatePerson key={setupIndex} participant={state.participants[setupIndex]} otherName={state.participants[1 - setupIndex].name} index={setupIndex} onChange={(values) => dispatch({ type: 'SET_PARTICIPANT', participant: setupIndex, values })} onContinue={continuePerson} />
    : screen === 'scenario' ? <ScenarioPicker selected={state.scenarioId} participant={state.participants[0]} onSelect={(id) => dispatch({ type: 'SELECT_SCENARIO', id })} onContinue={startResponses} />
    : ['handoff', 'perspective', 'response', 'compare'].includes(screen) ? <Conversation key={`${screen}-${active}`} screen={screen} state={state} active={active} onReady={handoffReady} onChange={updateResponse} onSubmit={submitResponse} onExpression={(expression) => dispatch({ type: 'SET_EXPRESSION', participant: active, expression })} error={responseError} onNext={() => screen === 'perspective' ? setScreen(state.status === 'revealed' ? 'compare' : 'response') : compareNext()} />
    : screen === 'reflection' ? <Reflection state={state} onChoose={(path) => { dispatch({ type: 'SET_REFLECTION', path }); setModal({ kind: 'reflection', path }); }} onEnd={() => setModal({ kind: 'end' })} onNewScenario={() => setModal({ kind: 'restart', destination: 'scenario' })} />
    : <section className="ending-screen"><Artwork name="welcome.png" className="ending-art" alt="" /><h1>A little more understanding.</h1><p>This session has ended. Your nicknames, choices, responses, reflections, and drawings have been cleared.</p><p className="field-hint">Nothing has been saved or uploaded.</p><div className="screen-actions"><Action onClick={() => { setAcknowledged(false); setScreen('welcome'); }}>Begin again</Action></div></section>;

  return <div className={`app-shell ${screen === 'onboarding' ? 'is-onboarding' : screen === 'reflection' ? 'is-reflection' : ''}`}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    {screen !== 'onboarding' && <Header title={title} onBack={!['welcome', 'handoff', 'ended'].includes(screen) ? goBack : undefined} onHelp={() => setModal({ kind: 'help' })} />}
    <main id="main-content" ref={mainRef} tabIndex={-1} className={`phone-main screen-${screen}`}>{body}</main>
    {modal?.kind === 'rules' && <Dialog title="A few things to remember." onClose={() => setModal(null)}><GroundRules />{modal.begin && <Action className="dialog-primary" onClick={acceptRules}>I agree · continue</Action>}</Dialog>}
    {modal?.kind === 'join' && <Dialog title="Scan to join" className="join-dialog" onClose={() => setModal(null)}><JoinPreview code={state.code} onContinue={() => { setSetupIndex(1); setScreen('person'); setModal(null); }} /></Dialog>}
    {chosenPath && <Dialog title="Reflection" onClose={() => setModal(null)}><ReflectionPrompt path={chosenPath} /></Dialog>}
    {modal?.kind === 'help' && <Dialog title="A little room for another view." onClose={() => setModal(null)}><p>Explore a fictional situation, share one response each, then read both responses together.</p><p className="small-copy">This version runs on one device. Your responses stay in this page’s memory and are cleared on refresh or when you end.</p><div className="help-actions"><button type="button" className="outline-button" onClick={() => setModal({ kind: 'rules' })}>Ground rules</button>{inSession ? <><button type="button" className="outline-button" onClick={() => setModal({ kind: 'restart', destination: 'welcome' })}>Start over</button><Action onClick={() => setModal({ kind: 'end' })}>End session</Action></> : <button type="button" className="outline-button" onClick={() => { setModal(null); setOnboardingIndex(0); setScreen('onboarding'); }}>View introduction</button>}</div></Dialog>}
    {modal?.kind === 'end' && <Dialog title="End this session?" onClose={() => setModal(null)}><p>Ending clears both people’s nicknames, choices, responses, reflections, and drawings on this device.</p><div className="dialog-actions"><button type="button" className="outline-button" onClick={() => setModal(null)}>Keep exploring</button><Action onClick={() => clearSession('ended')}>End session</Action></div></Dialog>}
    {modal?.kind === 'restart' && <Dialog title={modal.destination === 'scenario' ? 'Choose a new scenario?' : 'Start over?'} onClose={() => setModal(null)}><p>{modal.destination === 'scenario' ? 'Both responses, drawings, and your reflection choice will be cleared. You’ll keep your avatars and choose a fresh scenario.' : 'Both people’s nicknames, choices, responses, reflections, and drawings will be cleared.'}</p><div className="dialog-actions"><button type="button" className="outline-button" onClick={() => setModal(null)}>Keep this session</button><Action onClick={() => clearSession(modal.destination)}>{modal.destination === 'scenario' ? 'Choose a new scenario' : 'Start over'}</Action></div></Dialog>}
  </div>;
}
