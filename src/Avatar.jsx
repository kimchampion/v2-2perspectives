import { avatarLayers, avatarOptionLabel, avatarOptions, createAvatar } from './avatar.js';

export function AvatarIntro({ participant, children }) {
  return <div className="avatar-intro">
    <Avatar avatar={participant?.avatar} flushBottom className="screen-avatar" />
    <div className="avatar-intro-copy">{children}</div>
  </div>;
}

export default function Avatar({ avatar, crop = 'bust', flushBottom = false, decorative = false, className = '' }) {
  const selected = createAvatar(avatar);
  const description = ['hair', 'clothing', 'accessory', 'facialHair', 'expression'].map((field) => avatarOptionLabel(field, selected[field])).join(', ');
  const layers = avatarLayers(selected).filter((layer) => crop !== 'head' || layer.key !== 'clothing');
  const baseY = flushBottom ? avatarOptions.clothing.find((option) => option.id === selected.clothing).baseY : 1533;
  const topY = flushBottom ? avatarOptions.hair.find((option) => option.id === selected.hair).topY : 0;
  const visibleHeight = baseY - topY;
  return <svg className={`avatar-art ${className}`} style={flushBottom ? { '--avatar-visible-ratio': visibleHeight / baseY } : undefined} viewBox={crop === 'head' ? '190 30 800 990' : `0 ${topY} 1136 ${visibleHeight}`} preserveAspectRatio={flushBottom ? 'xMidYMax meet' : 'xMidYMid meet'} role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : `Avatar preview: ${description}`} focusable="false">
    {layers.map(({ key, href, x, y }) => <use key={key} href={`${href}#avatar-part`} x={x} y={y} aria-hidden="true" />)}
  </svg>;
}
