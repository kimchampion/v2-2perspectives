import { useState } from 'react';
import { Action, Artwork, Page } from '../components.jsx';

export default function Ending({ onBeginAgain }) {
  const [closeRequested, setCloseRequested] = useState(false);
  function closeApp() {
    setCloseRequested(true);
    try { window.close(); }
    catch { /* Keep the manual closing instructions if closing is unavailable. */ }
  }
  return <Page className="ending-screen" label="Session ended" actions={<>
      <Action onClick={onBeginAgain}>Begin again</Action>
      <button type="button" className="outline-button" onClick={closeApp}>Close app</button>
    </>}>
    <Artwork name="welcome.png" className="ending-art" alt="" />
    <h1>A little more understanding.</h1>
    <p>This session has ended. Your nicknames, choices, responses, reflections, and drawings have been cleared from this page.</p>
    <p className="field-hint close-app-status" role="status">{closeRequested ? 'You can now close this tab.' : ''}</p>
  </Page>;
}
