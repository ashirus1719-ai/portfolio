import type { Language, Theme } from "./content";

type Preferences = { language: Language; theme: Theme };
const defaults: Preferences = { language: "ru", theme: "dark" };
let current = defaults;
let initialized = false;
const listeners = new Set<() => void>();

function readSaved(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function apply() {
  document.documentElement.dataset.theme = current.theme;
  document.documentElement.lang = current.language;
}

function restore() {
  const savedLanguage = readSaved("portfolio-language");
  const savedTheme = readSaved("portfolio-theme");
  current = {
    language: savedLanguage === "ky" || savedLanguage === "en" ? savedLanguage : "ru",
    theme: savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : document.documentElement.dataset.theme === "light" ? "light" : "dark",
  };
  apply();
}

function handleStorage(event: StorageEvent) {
  if (event.key === null || event.key === "portfolio-theme" || event.key === "portfolio-language") {
    restore();
    listeners.forEach(listener => listener());
  }
}

export function subscribe(listener: () => void) {
  if (!initialized) { initialized = true; restore(); }
  if (listeners.size === 0) window.addEventListener("storage", handleStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", handleStorage);
  };
}

export function getSnapshot() { return current; }
export function getServerSnapshot() { return defaults; }

export function setLanguage(language: Language) {
  if (language !== "ru" && language !== "ky" && language !== "en") return;
  current = { ...current, language };
  apply();
  try { localStorage.setItem("portfolio-language", language); } catch { /* Switching works without storage. */ }
  listeners.forEach(listener => listener());
}

export function toggleTheme() {
  current = { ...current, theme: current.theme === "dark" ? "light" : "dark" };
  apply();
  try { localStorage.setItem("portfolio-theme", current.theme); } catch { /* Switching works without storage. */ }
  listeners.forEach(listener => listener());
}
