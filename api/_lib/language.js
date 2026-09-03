export const SUPPORTED_LANGUAGES = [
  "en-US",
  "zh-CN",
  "ko-KR",
  "ja-JP",
  "es-ES",
  "ru-RU",
  "pt-BR",
];

export const LANGUAGE_NAMES = Object.freeze({
  "en-US": "English (United States)",
  "zh-CN": "Simplified Chinese (简体中文)",
  "ko-KR": "Korean (한국어)",
  "ja-JP": "Japanese (日本語)",
  "es-ES": "Spanish (Español)",
  "ru-RU": "Russian (Русский)",
  "pt-BR": "Brazilian Portuguese (Português do Brasil)",
});

export function resolveLanguage(language) {
  if (language === "en") return "en-US";
  return SUPPORTED_LANGUAGES.includes(language) ? language : "en-US";
}

export function languageName(language) {
  return LANGUAGE_NAMES[resolveLanguage(language)];
}
