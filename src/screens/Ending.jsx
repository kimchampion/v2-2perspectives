import { useLanguage } from '../Language.jsx';
import { useState } from 'react';
import { Action, Artwork, Page } from '../components.jsx';
import { requestAppClose } from '../app-exit.js';

export default function Ending({ onBeginAgain, closeRequested = false, sharedEndUnconfirmed = false }) {
  const { t } = useLanguage();
  const [manualCloseRequested, setManualCloseRequested] = useState(false);
  function closeApp() {
    setManualCloseRequested(true);
    requestAppClose();
  }
  return <Page className="ending-screen" label={t("Session ended")} actions={<>
      <Action onClick={onBeginAgain}>{t("Begin again")}</Action>
      <button type="button" className="outline-button" onClick={closeApp}>{t("Close app")}</button>
    </>}>
    <p className="field-hint close-app-status" role="status">{closeRequested || manualCloseRequested ? t("You can now close this tab.") : ''}</p>
    {sharedEndUnconfirmed && <p className="field-hint" role="status">{t('Your activity on this device was cleared. We couldn’t confirm that the shared session ended for your partner.')}</p>}
    <Artwork name="welcome.png" className="ending-art" alt="" />
    <h1>{t("A little more understanding.")}</h1>
    <p>{t("This session has ended. Your nicknames, choices, responses, reflections, and drawings have been cleared from this page.")}</p>
  </Page>;
}
