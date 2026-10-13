"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import LanguageSelect from "./language-select";
import { languages, translations, type Language, type Theme } from "./content";
import { getServerSnapshot, getSnapshot, setLanguage, subscribe, toggleTheme } from "./preferences";

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{diagonal ? <path d="M6 18 18 6M6 6h12v12" /> : <path d="M5 12h14m-6-6 6 6-6 6" />}</svg>;
}

function ThemeIcons() {
  return <><svg className="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></svg><svg className="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M21 13a9 9 0 0 1-10-10A9 9 0 1 0 21 13Z" /></svg></>;
}

function ContactIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    telegram: <path d="m3 10 18-7-7 18-4-7-7-4Zm7 4L21 3" />,
    whatsapp: <><path d="m4 20 1-4a8 8 0 1 1 3 3l-4 1Z" /><path d="M9 8c0 4 3 7 7 7l1-2-3-1-1 1-2-2 1-1-1-3-2 1Z" /></>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".7" fill="currentColor" stroke="none" /></>,
    github: <><path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16" /></>,
    email: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 7 9 6 9-6" /></>,
    phone: <path d="M7 3H4a1 1 0 0 0-1 1c0 9 8 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a15 15 0 0 1-7-7l2-2-2-5Z" />,
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

type ViewProps = { language: Language; theme: Theme; onLanguageChange: (value: Language) => void; onThemeToggle: () => void };

export function PortfolioView({ language, theme, onLanguageChange, onThemeToggle }: ViewProps) {
  const t = translations[language];
  const projects = [
    { title: t.school, category: t.schoolCategory, description: t.schoolText, tags: t.schoolTags, image: "/projects/okurmen.png", width: 1437, height: 792, url: "https://okurmen-project-two.vercel.app/", domain: "okurmen-project-two.vercel.app" },
    { title: t.cafe, category: t.cafeCategory, description: t.cafeText, tags: t.cafeTags, image: "/projects/cafe.png", width: 1425, height: 765, url: "https://cafe-project-lilac.vercel.app/", domain: "cafe-project-lilac.vercel.app" },
  ];
  const skills = ["HTML5", "CSS3", "JavaScript (ES6+)", "React", "Next.js", "Vite", "Axios", "React Router", "REST API", "PostgreSQL", "Neon", t.responsive];
  const tools = ["Git & GitHub", "npm", "VS Code", "JSX", `TypeScript (${t.basics})`, "MockAPI / JSON API"];
  const contacts = [
    { label: "Telegram", value: "@t1vuk", href: "https://t.me/t1vuk", icon: "telegram" },
    { label: "WhatsApp", value: "+996 508 018 109", href: "https://wa.me/996508018109", icon: "whatsapp" },
    { label: "Instagram", value: "@t1vuk1", href: "https://www.instagram.com/t1vuk1/", icon: "instagram" },
    { label: "GitHub", value: "ashirus1719-ai", href: "https://github.com/ashirus1719-ai", icon: "github" },
    { label: t.email, value: "tt1vuk@gmail.com", href: "mailto:tt1vuk@gmail.com", icon: "email" },
    { label: t.phone, value: "+996 508 018 109", href: "tel:+996508018109", icon: "phone" },
  ];

  return <>
    <a className="skip-link" href="#main">{t.skip}</a>
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href="#top" aria-label={t.name}><span className="brand-symbol" aria-hidden="true">a<span>.</span></span><span className="brand-text">{t.firstName}<small>frontend developer</small></span></a>
        <nav className="navigation" aria-label={t.navigation}>{t.nav.map((label, index) => <a key={label} href={`#${["projects", "about", "contact"][index]}`}>{label}</a>)}</nav>
        <div className="header-controls">
          <LanguageSelect value={language} label={t.language} onChange={onLanguageChange} />
          <button className="theme-control" type="button" role="switch" aria-checked={theme === "dark"} aria-label={t.theme} title={theme === "dark" ? t.light : t.dark} onClick={onThemeToggle}><ThemeIcons /></button>
        </div>
      </div>
    </header>

    <main id="main" className="container">
      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-copy"><p className="eyebrow">{t.hello}</p><h1 id="hero-title">{t.firstName}<br />{t.lastName}<span className="accent">.</span></h1><p className="hero-role">{t.role}</p><p className="hero-intro">{t.intro}</p><div className="hero-actions"><a className="button button-primary" href="#projects">{t.viewProjects}<Arrow /></a><a className="button button-secondary" href="#contact">{t.write}<Arrow diagonal /></a></div></div>
        <aside className="profile-card" aria-label={t.profileLabel}>
          <div className="profile-top"><span className="status"><span />{t.available}</span><span className="code-mark" aria-hidden="true">&lt;/&gt;</span></div>
          <div className="profile-identity"><div className="avatar" aria-hidden="true">AA<span /></div><div><strong>{t.name}</strong><span>{t.role}</span><a href="https://github.com/ashirus1719-ai" target="_blank" rel="noopener noreferrer">@ashirus1719-ai <Arrow diagonal /></a></div></div>
          <div className="profile-facts"><div><span>{t.focus}</span><strong>{t.focusValue}</strong></div><div><span>{t.learning}</span><strong>{t.learningValue}</strong></div></div>
          <div className="profile-stack"><span>React</span><span>Next.js</span><span>JavaScript</span><span>REST API</span></div>
        </aside>
      </section>

      <section className="section projects-section" id="projects" aria-labelledby="projects-title">
        <div className="section-heading"><div><p className="eyebrow">{t.projectsLabel}</p><h2 id="projects-title">{t.projectsTitle}</h2></div><p>{t.projectsIntro}</p></div>
        <div className="project-grid">{projects.map((project, index) => <article className="project-card" key={project.url}>
          <a className="project-preview" href={project.url} target="_blank" rel="noopener noreferrer" aria-label={`${t.openSite}: ${project.title}`}><div className="browser-bar" aria-hidden="true"><span className="browser-dots"><i /><i /><i /></span><span>{project.domain}</span><Arrow diagonal /></div><Image src={project.image} alt={`${t.screenshot}: ${project.title}`} width={project.width} height={project.height} sizes="(max-width: 700px) calc(100vw - 32px), (max-width: 1200px) 46vw, 540px" priority={index === 0} /><span className="preview-open" aria-hidden="true"><Arrow diagonal /></span></a>
          <div className="project-content"><div className="project-meta"><span>{project.category}</span><span>0{index + 1}</span></div><h3><a href={project.url} target="_blank" rel="noopener noreferrer">{project.title}</a></h3><p>{project.description}</p><div className="tags">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div><a className="project-link" href={project.url} target="_blank" rel="noopener noreferrer">{t.openSite}<Arrow diagonal /></a></div>
        </article>)}</div>
      </section>

      <section className="section" id="about" aria-labelledby="about-title">
        <div className="section-heading"><div><p className="eyebrow">{t.aboutLabel}</p><h2 id="about-title">{t.aboutTitle}</h2></div></div>
        <div className="about-grid"><div className="about-copy"><p className="about-description">{t.aboutText}</p><div className="experience-block"><div className="info-heading"><h3>{t.experience}</h3><span>{t.since}</span></div><h4>{t.experienceTitle}</h4><p>{t.experienceText}</p></div><div className="experience-block"><div className="info-heading"><h3>{t.education}</h3></div><h4>{t.educationTitle}</h4><p>{t.educationText}</p></div></div>
          <div className="skills-panel"><div><h3>{t.skills}</h3><div className="tags skill-tags">{skills.map(skill => <span key={skill}>{skill}</span>)}</div></div><div><h3>{t.tools}</h3><div className="tags tool-tags">{tools.map(tool => <span key={tool}>{tool}</span>)}</div></div><div className="spoken-languages"><h3>{t.spoken}</h3><div>{t.spokenNames.map((name, index) => <div key={name}><span className={`flag flag-${languages[index].id}`} aria-hidden="true" /><span>{name}</span><strong>{["C2", "C2", "A2"][index]}</strong></div>)}</div></div></div>
        </div>
      </section>

      <section className="section contact-section" id="contact" aria-labelledby="contact-title"><div className="section-heading"><div><p className="eyebrow">{t.contactLabel}</p><h2 id="contact-title">{t.contactTitle}</h2></div><p>{t.contactText}</p></div><div className="contact-grid">{contacts.map(contact => <a className="contact-card" key={contact.label} href={contact.href} target={contact.href.startsWith("https:") ? "_blank" : undefined} rel={contact.href.startsWith("https:") ? "noopener noreferrer" : undefined}><span className="contact-icon" aria-hidden="true"><ContactIcon name={contact.icon} /></span><span className="contact-info"><strong>{contact.label}</strong><span>{contact.value}</span></span><Arrow diagonal /></a>)}</div></section>
    </main>
    <footer className="container footer"><span>© {t.name}</span><span>{t.footer}</span><a href="#top" aria-label={t.name}>↑</a></footer>
  </>;
}

export default function Portfolio() {
  const { language, theme } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const previousLanguage = useRef(language);
  useEffect(() => { document.title = `${translations[language].name} | Frontend Developer`; }, [language]);
  useEffect(() => {
    if (previousLanguage.current === language) return;
    previousLanguage.current = language;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const main = document.getElementById("main");
    const animation = main?.animate?.([{ opacity: .8 }, { opacity: 1 }], {
      duration: 160,
      easing: "ease-out",
    });
    return () => animation?.cancel();
  }, [language]);
  return <PortfolioView language={language} theme={theme} onLanguageChange={setLanguage} onThemeToggle={toggleTheme} />;
}
