import { Action, Artwork } from '../components.jsx';
import SelectionGrid from '../SelectionGrid.jsx';
import { reflectionPaths } from '../content.js';
import { canReveal } from '../session.js';

export default function Reflection({ state, onChoose, onEnd, onNewScenario }) {
  if (!canReveal(state)) return <p role="status">Both responses must be submitted before reflection.</p>;
  return <section className="reflection-screen">
    <h1 className="display-heading">Consider this &amp;<br />take it away</h1>
    <p className="reflection-intro">Does knowing the other person’s perspective change how you feel? Take a few minutes to talk, ask questions, and clarify what you meant.</p>
    <div className="reflection-scroll" role="region" aria-label="Reflection options"><SelectionGrid className="reflection-grid" label="Choose a way forward" columns={2} items={reflectionPaths} selectedId={state.reflection.path} opensDialog
      buttonClassName={(_path, chosen) => `reflection-card ${chosen ? 'is-selected' : ''}`} onActivate={(path) => onChoose(path.id)} renderOption={(path, chosen) => <>
      <span className="card-category">{path.label}</span><strong>{path.description}</strong><Artwork name={path.image} loading="lazy" />
      <span className="reflection-card-action">{chosen ? 'Selected ✓' : 'Explore this path'}</span>
    </>} /></div>
    <div className="screen-actions"><Action onClick={onEnd}>End Session</Action><button type="button" className="text-button new-scenario" onClick={onNewScenario}>Choose a new Scenario</button></div>
  </section>;
}

export function ReflectionPrompt({ path }) {
  return <div className="reflection-prompt"><div className="reflection-modal-heading"><Artwork name={path.image} /><div><h3>{path.title}</h3><p>{path.description}</p></div></div><ul>{path.questions.map((question) => <li key={question}>{question}</li>)}</ul></div>;
}
