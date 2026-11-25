import { spanishMessages } from './spanish.js';

export { spanishMessages };
export const normalizeLanguage = language => language === 'es' ? 'es' : 'en';

export function translate(message, language = 'en', values = {}) {
  if (typeof message !== 'string') return message;
  const template = normalizeLanguage(language) === 'es' && Object.hasOwn(spanishMessages, message) ? spanishMessages[message] : message;
  // One pass: nicknames containing braces, brackets, $ or translated words remain literal.
  return template.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (token, key) => Object.hasOwn(values, key) ? String(values[key]) : token);
}

export function translateError(message, language = 'en') {
  if (typeof message !== 'string' || !message || normalizeLanguage(language) === 'en') return message;
  return Object.hasOwn(spanishMessages, message) ? spanishMessages[message] : spanishMessages['Something went wrong. Please try again.'];
}
