/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const React = require('react');
const { renderToString } = require('react-dom/server');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function run(language, theme) {
  const dom = new JSDOM('<!doctype html><html lang="ru" data-theme="dark"><body><div id="root"></div></body></html>', { url: 'http://localhost:3000', pretendToBeVisual: true });
  const { window } = dom;
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.Node = window.Node;
  globalThis.HTMLElement = window.HTMLElement;
  Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
  window.matchMedia = () => ({ matches: false });
  const animations = [];
  window.HTMLElement.prototype.animate = function(frames, options) {
    animations.push({ element: this, frames, options });
    return { cancel() {} };
  };
  const { hydrateRoot } = require('react-dom/client');
  window.localStorage.setItem('portfolio-language', language);
  window.localStorage.setItem('portfolio-theme', theme);
  const globals = { window, document, Node, localStorage: window.localStorage };
  const modules = new Map();
  function load(filename) {
    filename = path.resolve(filename);
    if (modules.has(filename)) return modules.get(filename);
    const exports = {};
    modules.set(filename, exports);
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
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
  const Portfolio = load('app/portfolio.tsx').default;
  const container = document.getElementById('root');
  container.innerHTML = renderToString(React.createElement(Portfolio));
  vm.runInNewContext(fs.readFileSync('public/theme-init.js', 'utf8'), globals);
  const hydrationErrors = [];
  let root;
  await React.act(async () => { root = hydrateRoot(container, React.createElement(Portfolio), { onRecoverableError: error => hydrationErrors.push(error.message) }); });
  assert.deepEqual(hydrationErrors, [], 'no hydration errors');
  assert.equal(document.documentElement.lang, language);
  assert.equal(document.documentElement.dataset.theme, theme);
  const main = document.getElementById('main');
  assert.equal(document.querySelectorAll('[role="option"]').length, 0, 'initially closed without relying on CSS');
  const combobox = () => document.querySelector('[role="combobox"]');
  const themeButton = () => document.querySelector('[role="switch"]');
  const click = async element => React.act(async () => { element.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
  const key = async value => React.act(async () => { combobox().dispatchEvent(new window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true })); });
  for (let i = 0; i < 4; i++) {
    await click(themeButton());
    const expected = i % 2 === 0 ? (theme === 'dark' ? 'light' : 'dark') : theme;
    assert.equal(document.documentElement.dataset.theme, expected);
    assert.equal(themeButton().getAttribute('aria-checked'), String(expected === 'dark'));
    assert.equal(window.localStorage.getItem('portfolio-theme'), expected);
  }
  for (const value of ['ky', 'en', 'ru']) {
    combobox().focus();
    await click(combobox());
    assert.equal(combobox().getAttribute('aria-expanded'), 'true');
    assert.equal(document.querySelectorAll('[role="option"]').length, 3);
    const option = [...document.querySelectorAll('[role="option"]')].find(element => element.id.endsWith('-' + value));
    await click(option);
    assert.equal(document.documentElement.lang, value);
    assert.equal(window.localStorage.getItem('portfolio-language'), value);
    assert.equal(combobox().getAttribute('aria-expanded'), 'false');
    assert.equal(document.querySelectorAll('[role="option"]').length, 0);
    assert.equal(document.activeElement, combobox());
    assert.equal(document.getElementById('main'), main, 'keep the main DOM and scroll context');
  }
  await key('ArrowDown');
  await key('Home');
  await key('Enter');
  assert.equal(document.documentElement.lang, 'ky');
  await key('ArrowDown'); await key('End'); await key('Enter');
  assert.equal(document.documentElement.lang, 'en');
  await click(combobox()); await key('Escape');
  assert.equal(combobox().getAttribute('aria-expanded'), 'false');
  await click(combobox());
  await React.act(async () => { document.body.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true })); });
  assert.equal(combobox().getAttribute('aria-expanded'), 'false');
  await click(combobox()); await key('Tab');
  assert.equal(combobox().getAttribute('aria-expanded'), 'false');
  assert.ok(animations.length > 0, 'language changes animate');
  assert.ok(animations.every(animation => animation.frames.every(frame => !('transform' in frame))), 'animation does not move page');
  await React.act(async () => root.unmount());
  dom.window.close();
  console.log(`${language}/${theme}: real React hydration, mouse selection, keyboard navigation, outside dismissal, focus, theme clicks and persistence passed`);
}

(async () => {
  for (const language of ['ru', 'ky', 'en']) for (const theme of ['dark', 'light']) await run(language, theme);
})().catch(error => { console.error(error); process.exitCode = 1; });
