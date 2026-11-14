import { useState } from 'react';
import { Action, Dialog } from './components.jsx';
import Avatar from './Avatar.jsx';
import SelectionGrid from './SelectionGrid.jsx';
import { avatarOptions, createAvatar, isAvatar } from './avatar.js';

const categories = [
  { field: 'hair', label: 'Hair style', title: 'Hair style or head covering' },
  { field: 'clothing', label: 'Clothing', title: 'Clothing' },
  { field: 'accessory', label: 'Accessories', title: 'Accessories' },
  { field: 'expression', label: 'Expression', title: 'How are you feeling right now?' },
];

function OptionArt({ field, option, avatar }) {
  if (['accessory', 'facialHair'].includes(field) && option.id === 'none') return <span className="avatar-no-accessory" aria-hidden="true">—</span>;
  return <Avatar avatar={createAvatar({ ...avatar, [field]: option.id })} crop={field === 'clothing' ? 'bust' : 'head'} decorative className="avatar-option-thumbnail" />;
}

export function AvatarOptions({ field, avatar, onSelect }) {
  const selected = createAvatar(avatar);
  const category = field === 'facialHair' ? { title: 'Facial hair' } : categories.find((item) => item.field === field);
  if (!category) return null;
  return <SelectionGrid className="avatar-options" label={category.title} columns={3} items={avatarOptions[field]} selectedId={avatar?.[field]}
    getLabel={(option) => option.label} buttonClassName={(_option, chosen) => `avatar-option ${chosen ? 'is-selected' : ''}`}
    onActivate={(option) => onSelect(createAvatar({ ...selected, [field]: option.id }))} renderOption={(option, chosen) => <>
      <OptionArt field={field} option={option} avatar={selected} />
      <span className={field === 'expression' ? 'avatar-option-label sr-only' : 'avatar-option-label'}>{option.label}</span>
      <span className="avatar-selected-mark" aria-hidden="true">{chosen ? '✓' : ''}</span>
    </>} />;
}

export function AvatarDialog({ field, avatar, onSelect, onClose }) {
  const category = categories.find((item) => item.field === field);
  if (!category) return null;
  return <Dialog title={category.title} className="avatar-dialog avatar-scroll-dialog" onClose={onClose}>
    <figure className="avatar-preview avatar-dialog-frame">
      <Avatar avatar={avatar} flushBottom className="avatar-dialog-preview" />
    </figure>
    <div className="avatar-choice-scroll">
      {field === 'accessory' ? <>
        <section className="avatar-choice-group"><h3>Eyewear & accessories</h3><AvatarOptions field="accessory" avatar={avatar} onSelect={onSelect} /></section>
        <section className="avatar-choice-group"><h3>Facial hair</h3><AvatarOptions field="facialHair" avatar={avatar} onSelect={onSelect} /></section>
      </> : <AvatarOptions field={field} avatar={avatar} onSelect={onSelect} />}
    </div>
    <Action className="dialog-primary" onClick={onClose}>Done</Action>
  </Dialog>;
}

export default function AvatarBuilder({ avatar, onChange }) {
  const [editing, setEditing] = useState(null);
  return <div className="avatar-builder">
    <h2 className="person-section-heading">How are you feeling right now?</h2>
    <figure className="avatar-preview">
      <Avatar avatar={avatar} flushBottom />
    </figure>
    {!avatar && <p className="field-hint avatar-example-hint">Example avatar. Choose an option below to make it yours.</p>}
    <div className="avatar-controls-heading">
      <h2 className="person-section-heading">Build your avatar:</h2>
      <button type="button" className="text-button" disabled={!avatar} onClick={() => { setEditing(null); onChange(null); }}>Reset avatar</button>
    </div>
    <div className="avatar-categories" role="group" aria-label="Avatar customization">
      {categories.map((category) => <button key={category.field} type="button" className="avatar-category" aria-haspopup="dialog" aria-expanded={editing === category.field} onClick={() => setEditing(category.field)}>{category.label}</button>)}
    </div>
    {editing && <AvatarDialog field={editing} avatar={avatar} onSelect={onChange} onClose={() => setEditing(null)} />}
  </div>;
}

export function ResponseFeeling({ participant, onExpression }) {
  const [editing, setEditing] = useState(false);
  if (!isAvatar(participant?.avatar)) return null;
  return <div className="response-feeling">
    <span className="field-hint">How are you feeling right now?</span>
    <button type="button" className="text-button" aria-haspopup="dialog" aria-expanded={editing} onClick={() => setEditing(true)}>Change expression</button>
    {editing && <AvatarDialog field="expression" avatar={participant.avatar} onSelect={(avatar) => onExpression?.(avatar.expression)} onClose={() => setEditing(false)} />}
  </div>;
}
