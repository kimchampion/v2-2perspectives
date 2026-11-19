import { useEffect, useReducer, useRef, useState } from 'react';
import { Action, Dialog, ErrorMessage, GroundRules, Header, PageNotice } from './components.jsx';
import { reflectionPaths } from './content.js';
import { createSessionState, sessionReducer, validateResponse } from './session.js';
import { handoffReturnScreen } from './navigation.js';
import { Onboarding, Welcome } from './screens/Onboarding.jsx';
import { CreatePerson, ScenarioPicker, SessionChoices, SessionInvitation, JoinCodeForm, JointStatus } from './screens/Setup.jsx';
import Conversation from './screens/Conversation.jsx';
import { createSession, SESSION_START_TIMEOUT } from './lib/sessionClient.js';
import useJointSession from './useJointSession.js';
import Reflection, { ReflectionPrompt } from './screens/Reflection.jsx';
import Ending from './screens/Ending.jsx';
import { watchPhoneViewport } from './phone-viewport.js';

export default function App() {
  const [state, dispatch] = useReducer(sessionReducer, undefined, () => createSessionState());
  const [screen, setScreen] = useState('onboarding');
  const [onboardingIndex, setOnboardingIndex] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [welcomeError, setWelcomeError] = useState('');
  const [active, setActive] = useState(0);
  const [setupIndex, setSetupIndex] = useState(0);
  const [modal, setModal] = useState(null);
  const [responseError, setResponseError] = useState('');
  const [resumeScreen, setResumeScreen] = useState('perspective');
  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [serverWaiting, setServerWaiting] = useState(false);
  const [pendingJoinCode, setPendingJoinCode] = useState('');
  const [setupMode, setSetupMode] = useState(null);
  const [jointMode, setJointMode] = useState(false);
  const [jointBusy, setJointBusy] = useState(false);
  const creatorToken = useRef(null);
  const jointNavigation = useRef(null);
  const submissionRequest = useRef(null);
  const joint = useJointSession();
  const sessionRequest = useRef(null);
  const mainRef = useRef(null);
  const shellRef = useRef(null);
  const privateView = ['handoff', 'perspective', 'response'].includes(screen);
  const inSession = ['person', 'scenario', 'handoff', 'perspective', 'response', 'compare', 'reflection', 'joint-wait'].includes(screen);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    shellRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    mainRef.current?.focus({ preventScroll: true });
  }, [screen, active, setupIndex, onboardingIndex]);

  useEffect(() => () => sessionRequest.current?.abort(), []);
  useEffect(() => watchPhoneViewport(shellRef.current), []);
  useEffect(() => {
    setServerWaiting(false);
    if (!creatingSession) return;
    const timer = setTimeout(() => setServerWaiting(true), 5000);
    return () => clearTimeout(timer);
  }, [creatingSession]);

  useEffect(() => {
    const snapshot = joint.session;
    if (!jointMode || !snapshot) return;
    const previous = jointNavigation.current;
    jointNavigation.current = { round: snapshot.round, phase: snapshot.phase, path: snapshot.reflectionPath };
    dispatch({ type: 'SYNC_JOINT', session: snapshot });
    setActive(snapshot.participantIndex);
    const changedRound = previous?.round !== snapshot.round;
    if (snapshot.phase === 'ended') {
      creatorToken.current = null; setSetupMode(null); setPendingJoinCode(''); setModal(null); setResponseError(''); setScreen('ended');
    } else if (snapshot.phase === 'lobby') {
      if (changedRound || previous?.phase !== 'lobby') { setModal(null); setResponseError(''); setScreen('joint-wait'); }
    } else if (snapshot.phase === 'responding') {
      if (snapshot.participants[snapshot.participantIndex].submitted) setScreen('joint-wait');
      else if (changedRound || previous?.phase !== 'responding') { setModal(null); setResponseError(''); setScreen('perspective'); }
    } else if (snapshot.phase === 'revealed') {
      if (changedRound || previous?.phase !== 'revealed') { setModal(null); setResponseError(''); setScreen('compare'); }
      if (snapshot.reflectionPath && previous?.path !== snapshot.reflectionPath) { setScreen('reflection'); setModal({ kind: 'reflection', path: snapshot.reflectionPath }); }
    }
  }, [joint.session, jointMode]);

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

  function cancelCreation() {
    sessionRequest.current?.abort();
    sessionRequest.current = null;
    setCreatingSession(false);
    setSessionError('');
  }
  function closeRules() { setModal(null); }

  function acceptRules() { setModal(null); setScreen('session-mode'); }

  function startSession(code, codeSource, hostToken) {
    submissionRequest.current = null; setJointBusy(false);
    joint.stop(); setJointMode(false); jointNavigation.current = null;
    creatorToken.current = hostToken || null;
    dispatch({ type: 'RESET', code, codeSource });
    setSessionError(''); setWelcomeError('');
    setSetupIndex(0); setActive(0); setModal(null); setScreen('person');
  }

  function continueLocally() {
    cancelCreation();
    setSetupMode('local');
    setPendingJoinCode('');
    startSession('', 'local');
  }

  async function createSharedSession() {
    if (sessionRequest.current) return;
    if (creatorToken.current && state.code && state.codeSource === 'server') { setSetupMode('create'); setScreen('session-code'); return; }
    const request = new AbortController();
    sessionRequest.current = request;
    setSessionError('');
    setCreatingSession(true);
    try {
      const session = await createSession({ signal: request.signal, timeoutMs: SESSION_START_TIMEOUT });
      if (request.signal.aborted || sessionRequest.current !== request) return;
      if (!session.hostToken) throw new Error('This server does not support shared sessions.');
      joint.stop(); setJointMode(false); jointNavigation.current = null;
      creatorToken.current = session.hostToken;
      dispatch({ type: 'RESET', code: session.code, codeSource: 'server' });
      setSetupMode('create'); setPendingJoinCode(''); setSetupIndex(0); setActive(0);
      setScreen('session-code');
    } catch (error) {
      if (request.signal.aborted || sessionRequest.current !== request) return;
      setSessionError(error?.name === 'TimeoutError'
        ? 'The session server didn’t respond. Try creating a session again, or choose Shared Device.'
        : 'We couldn’t create a shared session. Try again, or choose Shared Device.');
    } finally {
      if (sessionRequest.current === request) {
        sessionRequest.current = null;
        setCreatingSession(false);
      }
    }
  }

  function askToJoin() {
    cancelCreation(); setModal({ kind: 'join-entry' });
  }
  function joinWithCode(code) {
    const preservePersona = setupMode === 'join' && state.code === code && state.status === 'setup';
    setSetupMode('join'); setPendingJoinCode(code);
    if (preservePersona) { setSetupIndex(0); setModal(null); setScreen('person'); }
    else startSession(code, 'server');
  }
  function enterJoint(code, participant = state.participants[0]) {
    submissionRequest.current = null;
    setResponseError(''); setModal(null); setJointMode(true); setJointBusy(false);
    jointNavigation.current = null; setScreen('joint-wait');
    joint.begin({ code, participant, hostToken: code === state.code ? creatorToken.current : undefined });
  }
  function leaveJoint() {
    submissionRequest.current = null; setJointBusy(false);
    joint.stop(); setJointMode(false); jointNavigation.current = null; creatorToken.current = null;
    dispatch({ type: 'RESET' }); setSetupMode(null);
    setPendingJoinCode(''); setModal(null); setAcknowledged(false); setWelcomeError(''); setResponseError(''); setScreen('welcome');
  }

  function continuePerson(values) {
    dispatch({ type: 'SET_PARTICIPANT', participant: setupIndex, values });
    if (setupMode === 'create' || setupMode === 'join') enterJoint(state.code, values);
    else if (setupIndex === 0) setSetupIndex(1);
    else setScreen('scenario');
  }
  async function startResponses() {
    if (jointMode) {
      try { await joint.command('select-scenario', { scenarioId: state.scenarioId }); setResponseError(''); }
      catch (error) { if (error.name !== 'AbortError') setResponseError(error.message); }
      return;
    }
    dispatch({ type: 'START_RESPONSES' });
    setActive(0); setResponseError(''); setResumeScreen('perspective'); setScreen('handoff');
  }
  function updateResponse(values) {
    setResponseError(''); dispatch({ type: 'UPDATE_RESPONSE', participant: active, values });
  }
  async function submitResponse(text) {
    const response = { ...state.responses[active], text };
    const issue = validateResponse(response);
    if (issue) { setResponseError(issue); document.getElementById('response-text')?.focus(); return; }
    dispatch({ type: 'UPDATE_RESPONSE', participant: active, values: { text } });
    if (jointMode) {
      if (jointBusy) return;
      const request = {};
      submissionRequest.current = request;
      setJointBusy(true); setResponseError('');
      try {
        await joint.command('submit-perspective', { response: { mode: response.mode, text: response.text, drawing: response.drawing, color: response.color }, expression: state.participants[active].avatar.expression });
      } catch (error) { if (error.name !== 'AbortError') setResponseError(error.message); }
      finally { if (submissionRequest.current === request) { submissionRequest.current = null; setJointBusy(false); } }
      return;
    }
    dispatch({ type: 'SUBMIT_RESPONSE', participant: active });
    setResponseError(''); setResumeScreen('perspective');
    if (state.responses[1 - active].submitted) { setActive(0); setScreen('compare'); }
    else { setActive(1 - active); setScreen('handoff'); }
  }
  function compareNext() {
    if (jointMode) setScreen('reflection');
    else if (active === 0) setActive(1);
    else setScreen('reflection');
  }
  async function clearSession(destination) {
    if (jointMode) {
      try {
        await joint.command(destination === 'scenario' ? 'restart-scenario' : 'end-session');
        setModal(null); setResponseError('');
        if (destination !== 'scenario') {
          joint.stop(); setJointMode(false); jointNavigation.current = null; creatorToken.current = null; setPendingJoinCode('');
          dispatch({ type: destination === 'ended' ? 'END' : 'RESET' }); setSetupMode(null);
          setScreen(destination); if (destination === 'welcome') setAcknowledged(false);
        }
      } catch (error) { if (error.name !== 'AbortError') { setModal(null); setResponseError(error.message); } }
      return;
    }
    cancelCreation();
    if (destination !== 'scenario') { creatorToken.current = null; setSetupMode(null); setPendingJoinCode(''); }
    const participants = state.participants.map((participant) => ({ ...participant }));
    dispatch({ type: destination === 'ended' ? 'END' : 'RESET', code: destination === 'scenario' ? state.code : '', codeSource: destination === 'scenario' ? state.codeSource : 'local' });
    if (destination === 'scenario') participants.forEach((values, participant) => dispatch({ type: 'SET_PARTICIPANT', participant, values }));
    setResponseError(''); setWelcomeError(''); setSessionError(''); setResumeScreen('perspective'); setModal(null); setActive(0); setSetupIndex(0);
    if (destination === 'welcome') setAcknowledged(false);
    setScreen(destination);
  }
  function goBack() {
    setResponseError('');
    if (screen === 'welcome') { setOnboardingIndex(3); setScreen('onboarding'); }
    else if (screen === 'session-mode') { cancelCreation(); setScreen('welcome'); }
    else if (screen === 'session-code') setScreen('session-mode');
    else if (screen === 'person' && setupIndex === 1) setSetupIndex(0);
    else if (screen === 'person') setScreen(setupMode === 'create' ? 'session-code' : 'session-mode');
    else if (screen === 'scenario') { if (jointMode) setScreen('joint-wait'); else { setSetupIndex(1); setScreen('person'); } }
    else if (screen === 'response') setScreen('perspective');
    else if (screen === 'perspective') { setResumeScreen('perspective'); setScreen('handoff'); }
    else if (screen === 'compare' && active === 1 && !jointMode) setActive(0);
    else if (screen === 'compare') setScreen('perspective');
    else if (screen === 'reflection') { if (!jointMode) setActive(1); setScreen('compare'); }
  }
  function handoffReady() {
    setScreen(handoffReturnScreen(state.status, resumeScreen));
    setResumeScreen('perspective');
  }
  async function chooseReflection(path) {
    if (jointMode) {
      if (state.reflection.path === path) { setModal({ kind: 'reflection', path }); return; }
      try { await joint.command('choose-repair-step', { repairChoice: path }); setResponseError(''); }
      catch (error) { if (error.name !== 'AbortError') setResponseError(error.message); }
    } else { dispatch({ type: 'SET_REFLECTION', path }); setModal({ kind: 'reflection', path }); }
  }
  const title = screen === 'session-mode' ? 'Start Session' : screen === 'person' ? setupMode === 'join' ? 'Your persona' : `Person ${setupIndex + 1} of 2` : screen === 'joint-wait' ? 'Joint session' : privateView && screen !== 'handoff' ? 'Your Perspective' : ['compare', 'reflection'].includes(screen) ? 'Discussion' : '';
  const chosenPath = modal?.kind === 'reflection' && reflectionPaths.find((path) => path.id === modal.path);
  const body = screen === 'onboarding' ? <Onboarding index={onboardingIndex} onChange={setOnboardingIndex} onFinish={() => setScreen('welcome')} />
    : screen === 'welcome' ? <Welcome acknowledged={acknowledged} onAcknowledge={(value) => { setAcknowledged(value); setWelcomeError(''); }} onBegin={begin} error={welcomeError} />
    : screen === 'session-mode' ? <SessionChoices pending={creatingSession} waiting={serverWaiting} error={sessionError} onCreate={createSharedSession} onJoin={askToJoin} onLocal={continueLocally} />
    : screen === 'session-code' ? <SessionInvitation code={state.code} onContinue={() => { setSetupIndex(0); setActive(0); setScreen('person'); }} />
    : screen === 'person' ? <CreatePerson key={setupIndex} participant={state.participants[setupIndex]} otherName={state.participants[1 - setupIndex].name} onChange={(values) => dispatch({ type: 'SET_PARTICIPANT', participant: setupIndex, values })} onContinue={continuePerson} />
    : screen === 'joint-wait' ? <JointStatus code={pendingJoinCode || state.code} session={joint.session} connection={joint.connection} slow={joint.slow} error={joint.error} onRetry={joint.retry} onLeave={() => joint.connection === 'connected' ? setModal({ kind: 'end' }) : leaveJoint()} onChooseScenario={() => setScreen('scenario')} />
    : screen === 'scenario' ? <ScenarioPicker selected={state.scenarioId} participant={state.participants[jointMode ? active : 0]} participants={state.participants} onSelect={(id) => dispatch({ type: 'SELECT_SCENARIO', id })} onContinue={startResponses} />
    : ['handoff', 'perspective', 'response', 'compare'].includes(screen) ? <Conversation key={`${screen}-${active}`} screen={screen} state={state} active={active} joint={jointMode} busy={jointBusy} onReady={handoffReady} onChange={updateResponse} onSubmit={submitResponse} error={responseError} onNext={() => screen === 'perspective' ? setScreen(state.status === 'revealed' ? 'compare' : 'response') : compareNext()} />
    : screen === 'reflection' ? <Reflection state={state} onChoose={chooseReflection} onEnd={() => setModal({ kind: 'end' })} onNewScenario={() => setModal({ kind: 'restart', destination: 'scenario' })} />
    : <Ending onBeginAgain={leaveJoint} />;

  return <div ref={shellRef} className={`app-shell ${screen === 'onboarding' ? 'is-onboarding' : screen === 'reflection' ? 'is-reflection' : ''}`}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    {screen !== 'onboarding' && <Header title={title} onBack={!['welcome', 'handoff', 'ended', 'joint-wait'].includes(screen) ? goBack : undefined} onHelp={() => setModal({ kind: 'help' })} />}
    <main id="main-content" ref={mainRef} tabIndex={-1} className={`phone-main screen-${screen}`}>
      <PageNotice.Provider value={<>
        {jointMode && joint.session && !['connected', 'ended'].includes(joint.connection) && screen !== 'joint-wait' && <div className="joint-connection-notice" role="status"><p>{joint.error || (joint.slow ? 'The session server may be waking up. Your draft stays on this device.' : 'Reconnecting to your partner. Your draft stays on this device.')}</p>{joint.error && <button type="button" className="text-button" onClick={joint.retry}>Try reconnecting</button>}<button type="button" className="text-button" onClick={leaveJoint}>Return to start</button></div>}
        {responseError && screen !== 'response' && <ErrorMessage>{responseError}</ErrorMessage>}
      </>}>{body}</PageNotice.Provider>
    </main>
    {modal?.kind === 'rules' && <Dialog title="A few things to remember." onClose={closeRules}><GroundRules />{modal.begin && <Action className="dialog-primary" onClick={acceptRules}>I agree · continue</Action>}</Dialog>}
    {modal?.kind === 'join-entry' && <Dialog title="Join a session" onClose={() => setModal(null)}><JoinCodeForm initialCode={pendingJoinCode} onJoin={joinWithCode} /></Dialog>}
    {chosenPath && <Dialog title="Reflection" onClose={() => setModal(null)}><ReflectionPrompt path={chosenPath} /></Dialog>}
    {modal?.kind === 'help' && <Dialog title="A little room for another view." onClose={() => setModal(null)}><p>Explore a fictional situation, share one response each, then read both responses together.</p><p className="small-copy">{jointMode ? 'Your nickname, avatar, and submitted response are temporarily shared for this joint session. Drafts stay on your device. Keep this page open to reconnect; refreshing or a server restart can end the session.' : 'You can take turns on one device or join your partner on separate devices. Drafts stay in this page’s memory and are cleared on refresh or when you end.'}</p><div className="help-actions"><button type="button" className="outline-button" onClick={() => setModal({ kind: 'rules' })}>Ground rules</button>{inSession ? <><button type="button" className="outline-button" onClick={() => setModal({ kind: 'restart', destination: 'welcome' })}>Start over</button><Action onClick={() => setModal({ kind: 'end' })}>End session</Action></> : <button type="button" className="outline-button" onClick={() => { cancelCreation(); setModal(null); setOnboardingIndex(0); setScreen('onboarding'); }}>View introduction</button>}</div></Dialog>}
    {modal?.kind === 'end' && <Dialog title="End this session?" onClose={() => setModal(null)}><p>Ending clears both people’s nicknames, choices, responses, reflections, and drawings {jointMode ? 'and ends the shared session on both devices' : 'on this device'}.</p><div className="dialog-actions"><button type="button" className="outline-button" onClick={() => setModal(null)}>Keep exploring</button><Action onClick={() => clearSession('ended')}>End session</Action></div></Dialog>}
    {modal?.kind === 'restart' && <Dialog title={modal.destination === 'scenario' ? 'Choose a new scenario?' : 'Start over?'} onClose={() => setModal(null)}><p>{modal.destination === 'scenario' ? `Both responses, drawings, and your reflection choice will be cleared. You’ll keep your avatars. ${jointMode ? 'The creator will choose the next scenario.' : 'Choose a fresh scenario.'}` : `Both people’s nicknames, choices, responses, reflections, and drawings will be cleared.${jointMode ? ' This ends the shared session on both devices.' : ''}`}</p><div className="dialog-actions"><button type="button" className="outline-button" onClick={() => setModal(null)}>Keep this session</button><Action onClick={() => clearSession(modal.destination)}>{modal.destination === 'scenario' ? 'Choose a new scenario' : 'Start over'}</Action></div></Dialog>}
  </div>;
}
