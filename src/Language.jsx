import { createContext, Fragment, useContext, useEffect, useId, useMemo, useState } from 'react';
import { normalizeLanguage, translate, translateError } from './i18n.js';

const LanguageContext = createContext({ language: 'en', setLanguage() {}, t: (message, values) => translate(message, 'en', values), errorText: message => translateError(message, 'en') });

export function LanguageProvider({ children, initialLanguage = 'en' }) {
  const [language, updateLanguage] = useState(() => normalizeLanguage(initialLanguage));
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const value = useMemo(() => ({
    language,
    setLanguage: next => updateLanguage(normalizeLanguage(next)),
    t: (message, values) => translate(message, language, values),
    errorText: message => translateError(message, language),
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);

export function LanguageChoice() {
  const { language, setLanguage } = useLanguage();
  const id = useId();
  return <div className="language-choice">
    <label htmlFor={id}><span lang="en">Language</span> / <span lang="es">Idioma</span></label>
    <select id={id} name="language" value={language} onChange={event => setLanguage(event.target.value)}>
      <option value="en" lang="en">English</option>
      <option value="es" lang="es">Español</option>
    </select>
  </div>;
}

// Explicit rich text only; never traverse or translate participant-authored children.
export function Localized({ message, values = {} }) {
  const { t } = useLanguage();
  return t(message).split(/(\{[A-Za-z][A-Za-z0-9]*\})/g).map((part, index) => {
    const key = part.slice(1, -1);
    return <Fragment key={index}>{part.startsWith('{') && Object.hasOwn(values, key) ? values[key] : part}</Fragment>;
  });
}
