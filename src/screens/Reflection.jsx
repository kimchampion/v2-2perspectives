import { useLanguage } from '../Language.jsx';
import { Action, Artwork, Page } from '../components.jsx';
import SelectionGrid from '../SelectionGrid.jsx';
import { reflectionPaths } from '../content.js';
import { canReveal } from '../session.js';

export default function Reflection({ state, onChoose, onEnd, onNewScenario }) {
  const { t } = useLanguage();
  if (!canReveal(state)) return <Page><p role="status">{t("Both responses must be submitted before reflection.")}</p></Page>;
  return <Page className="reflection-screen" label={t("Reflection")} actions={<>
    <Action onClick={onEnd}>{t("End Session")}</Action><button type="button" className="text-button new-scenario" onClick={onNewScenario}>{t("Choose a new Scenario")}</button>
  </>}>
    <h1 className="heading-medium">{t("Consider this &")}<br />{t("take it away")}</h1>
    <p className="reflection-intro">{t("Does knowing the other person’s perspective change how you feel? Take a few minutes to talk, ask questions, and clarify what you meant.")}</p>
    <SelectionGrid className="reflection-grid" label={t("Choose a way forward")} columns={2} items={reflectionPaths} selectedId={state.reflection.path} opensDialog
      buttonClassName={(_path, chosen) => `reflection-card ${chosen ? 'is-selected' : ''}`} onActivate={(path) => onChoose(path.id)} renderOption={(path, chosen) => <>
      <span className="card-category">{t(path.label)}</span><strong>{t(path.description)}</strong><Artwork name={path.image} loading="lazy" />
      <span className="reflection-card-action">{chosen ? t("Selected ✓") : t("Explore this path")}</span>
    </>} />
  </Page>;
}

export function ReflectionPrompt({ path }) {
  const { t } = useLanguage();
  return <div className="reflection-prompt"><div className="reflection-modal-heading"><Artwork name={path.image} /><div><h3>{t(path.title)}</h3><p>{t(path.description)}</p></div></div><ul>{path.questions.map((question) => <li key={question}>{t(question)}</li>)}</ul></div>;
}
