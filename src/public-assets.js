export function publicAsset(path) {
  const base = import.meta.env ? import.meta.env.BASE_URL : '/';
  return `${base}${path.replace(/^\/+/, '')}`;
}
