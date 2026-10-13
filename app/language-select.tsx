"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { languages, type Language } from "./content";

type Props = { value: Language; label: string; onChange: (language: Language) => void };

export default function LanguageSelect({ value, label, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const selectedIndex = languages.findIndex(language => language.id === value);
  const selected = languages[selectedIndex];

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function choose(index: number) {
    const next = languages[index].id;
    if (next !== value) onChange(next);
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  function handleKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive(open ? (active + (event.key === "ArrowDown" ? 1 : -1) + languages.length) % languages.length : selectedIndex);
      setOpen(true);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : languages.length - 1);
      setOpen(true);
    } else if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      choose(active);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const index = languages.findIndex(language => language.name.toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()));
      if (index >= 0) { event.preventDefault(); setActive(index); setOpen(true); }
    }
  }

  return <div className="language-picker" ref={root} data-open={open} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button ref={trigger} type="button" className="language-trigger" role="combobox" aria-label={`${label}: ${selected.name}`} aria-expanded={open} aria-haspopup="listbox" aria-controls={id} aria-activedescendant={open ? `${id}-${languages[active].id}` : undefined} onClick={() => {
      setActive(selectedIndex);
      setOpen(!open);
    }} onKeyDown={handleKey}>
      <span className="language-value" key={value}><span className={`flag flag-${value}`} aria-hidden="true" /><span>{selected.name}</span></span>
      <svg className="language-chevron" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
    {open && <div className="language-popup">
      <div className="language-options" id={id} role="listbox" aria-label={label}>
        {languages.map((language, index) => <div className="language-option" key={language.id} id={`${id}-${language.id}`} role="option" aria-selected={language.id === value} data-active={open && active === index} onPointerMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}>
          <span className={`flag flag-${language.id}`} aria-hidden="true" /><span>{language.name}</span><span className="language-code">{language.id.toUpperCase()}</span><svg className="language-check" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>)}
      </div>
    </div>}
  </div>;
}
