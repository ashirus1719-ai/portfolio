/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Execute the real preference store. Only the platform APIs are simulated.
function createEnvironment(saved = {}, blocked = false) {
  const storage = new Map(Object.entries(saved));
  const events = new Map();
  const root = { dataset: { theme: 'dark' }, lang: 'ru' };
  const globals = {
    document: { documentElement: root },
    window: {
      addEventListener: (name, callback) => events.set(name, callback),
      removeEventListener: name => events.delete(name),
    },
    localStorage: {
      getItem: key => { if (blocked) throw Error('Storage blocked'); return storage.get(key) ?? null; },
      setItem: (key, value) => { if (blocked) throw Error('Storage blocked'); storage.set(key, value); },
    },
  };
  const modules = new Map();
  function load(filename) {
    filename = path.resolve(filename);
    if (modules.has(filename)) return modules.get(filename);
    const exports = {};
    modules.set(filename, exports);
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    vm.runInNewContext(compiled, {
      ...globals, exports,
      require: name => {
        if (!name.startsWith('.')) return require(name);
        const base = path.resolve(path.dirname(filename), name);
        return load(fs.existsSync(base + '.ts') ? base + '.ts' : base + '.tsx');
      },
    }, { filename });
    return exports;
  }
  vm.runInNewContext(fs.readFileSync('public/theme-init.js', 'utf8'), globals);
  return { storage, root, events, load };
}

for (const language of ['ru', 'ky', 'en']) {
  for (const theme of ['dark', 'light']) {
    const env = createEnvironment({ 'portfolio-language': language, 'portfolio-theme': theme });
    assert.equal(env.root.dataset.theme, theme, 'theme applied before hydration');
    const store = env.load('app/preferences.ts');
    let notifications = 0;
    const unsubscribe = store.subscribe(() => notifications++);
    assert.equal(store.getSnapshot().language, language);
    assert.equal(store.getSnapshot().theme, theme);
    assert.equal(env.root.lang, language);
    assert.equal(store.getServerSnapshot().theme, 'dark', 'stable server snapshot');
    const { PortfolioView } = env.load('app/portfolio.tsx');
    function render() {
      return PortfolioView({ ...store.getSnapshot(), onLanguageChange: store.setLanguage, onThemeToggle: store.toggleTheme });
    }
    const element = render();
    const html = renderToStaticMarkup(element);
    assert.equal((html.match(/<h1 /g) || []).length, 1);
    assert.ok(html.includes(`aria-checked="${theme === 'dark'}"`));
    assert.equal((html.match(/role="combobox"/g) || []).length, 1);
    assert.equal((html.match(/role="option"/g) || []).length, 0, 'closed list has no options in the DOM');
    assert.ok(html.includes(`class="flag flag-${language}"`));
    assert.ok(html.includes('aria-expanded="false"'));
    assert.ok(!html.includes('class="language-popup"'), 'closed popup cannot appear without styles');
    for (const id of ['main', 'projects', 'about', 'contact']) assert.ok(html.includes(`id="${id}"`));
    for (const link of ['https://t.me/t1vuk', 'https://wa.me/996508018109', 'https://www.instagram.com/t1vuk1/', 'https://github.com/ashirus1719-ai', 'mailto:tt1vuk@gmail.com', 'tel:+996508018109', 'https://cafe-project-lilac.vercel.app/', 'https://okurmen-project-two.vercel.app/']) assert.ok(html.includes(`href="${link}"`), link);
    const controls = [];
    function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'button' || node.type?.name === 'LanguageSelect') controls.push(node);
      React.Children.forEach(node.props?.children, walk);
    }
    walk(element);
    const button = controls.find(node => node.type === 'button');
    const select = controls.find(node => node.type?.name === 'LanguageSelect');
    for (let i = 0; i < 6; i++) {
      button.props.onClick();
      const expected = i % 2 === 0 ? (theme === 'dark' ? 'light' : 'dark') : theme;
      assert.equal(store.getSnapshot().theme, expected);
      assert.equal(env.root.dataset.theme, expected, 'visible theme updates immediately');
      assert.equal(env.storage.get('portfolio-theme'), expected);
      assert.ok(renderToStaticMarkup(render()).includes(`aria-checked="${expected === 'dark'}"`));
    }
    for (const value of ['ky', 'en', 'ru']) {
      select.props.onChange(value);
      assert.equal(env.root.lang, value);
      assert.equal(store.getSnapshot().language, value);
      assert.equal(env.storage.get('portfolio-language'), value);
      assert.ok(renderToStaticMarkup(render()).includes(`class="flag flag-${value}"`));
    }
    assert.equal(notifications, 9);
    select.props.onChange('invalid');
    assert.equal(store.getSnapshot().language, 'ru', 'ignore invalid selections');
    env.storage.set('portfolio-theme', 'light');
    env.events.get('storage')({ key: 'portfolio-theme' });
    assert.equal(env.root.dataset.theme, 'light', 'sync another tab');
    const reload = createEnvironment(Object.fromEntries(env.storage));
    const reloadedStore = reload.load('app/preferences.ts');
    const cleanup = reloadedStore.subscribe(() => {});
    assert.equal(reloadedStore.getSnapshot().theme, 'light', 'restored after reload');
    assert.equal(reloadedStore.getSnapshot().language, 'ru');
    cleanup(); unsubscribe();
    assert.equal(env.events.size, 0, 'listeners cleaned up');
    console.log(`${language}/${theme}: rendering, header controls, repeated toggles, persistence, links and reload passed`);
  }
}

for (const blocked of [false, true]) {
  const env = createEnvironment({ 'portfolio-theme': 'invalid', 'portfolio-language': 'invalid' }, blocked);
  const store = env.load('app/preferences.ts');
  const cleanup = store.subscribe(() => {});
  assert.equal(store.getSnapshot().language, 'ru');
  assert.equal(store.getSnapshot().theme, 'dark');
  assert.doesNotThrow(() => { store.toggleTheme(); store.setLanguage('ky'); });
  assert.equal(env.root.dataset.theme, 'light');
  assert.equal(env.root.lang, 'ky');
  cleanup();
}

const css = fs.readFileSync('app/globals.css', 'utf8');
function luminance(hex) {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
function contrast(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
for (const theme of ['dark', 'light']) {
  const block = css.match(new RegExp(`html\\[data-theme="${theme}"\\] \\{([^}]+)\\}`))[1];
  const variables = Object.fromEntries([...block.matchAll(/--([\w-]+): (#[a-f\d]{6});/g)].map(m => [m[1], m[2]]));
  for (const text of ['foreground', 'muted', 'accent']) for (const background of ['background', 'surface', 'surface-soft']) assert.ok(contrast(variables[text], variables[background]) >= 4.5, `${theme}: ${text} on ${background} contrast`);
  assert.ok(contrast(variables['button-text'], variables['button-background']) >= 4.5);
}
for (const file of ['public/projects/okurmen.png', 'public/projects/cafe.png', 'public/flags/ky.svg', 'public/flags/ru.svg', 'public/flags/en.svg']) assert.ok(fs.existsSync(file));
console.log('Blocked storage, invalid settings, image assets and text contrast in both themes passed.');
