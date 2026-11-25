import { useLanguage } from '../Language.jsx';
import { Page } from '../components.jsx';
import { publicAsset } from '../public-assets.js';

export const SPLASH_DURATION = 2000;

export default function Splash() {
  const { t } = useLanguage();
  return <Page className="splash-screen" label={t("Two Perspectives splash")}>
    <div className="splash-lockup">
      <svg className="splash-logo" width="233.12" height="211.77" viewBox="0 0 233.12 211.77" aria-hidden="true" focusable="false">
        <g transform="translate(65.83948 44.48773)">
          <g className="splash-bubble-filled">
            <g className="splash-scale-filled"><image href={publicAsset('assets/splash-filled.svg')} width="167.27634" height="167.27634" /></g>
          </g>
        </g>
        <g className="splash-bubble-outline">
          <g className="splash-scale-outline"><image href={publicAsset('assets/splash-outline.svg')} width="165.49434" height="165.49434" /></g>
        </g>
      </svg>
      <h1 className="splash-title">{t("Two Perspectives")}</h1>
    </div>
  </Page>;
}
