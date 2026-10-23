// ==UserScript==
// @name         GitHub My Work - Configurable Dashboard
// @namespace    https://github.com/shijianjs/userscripts
// @version      1.1.0
// @description  A configurable multi-column dashboard for GitHub Issues and pull requests.
// @author       shijianjs
// @license      MIT
// @match        https://github.com/*
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  if (window.top !== window.self) return;
  if (document.querySelector('gmw-app')) return;

  const STORAGE_KEY = 'github-my-work.settings.v2';
  const LEGACY_STORAGE_KEY = 'github-my-work.settings.v1';
  const ICONIFY_SRC = 'https://cdn.jsdelivr.net/npm/iconify-icon@2.1.0/dist/iconify-icon.min.js';
  const MAX_COLUMNS = 8;
  const SEARCH_URL_PREFIX = '/issues?q=';
  const GITHUB_URL_PATTERN = /^(?:https?:\/\/)?(?:www\.)?github\.com\/\S*$/i;

  // 默认视图：只在没有保存过设置时使用，标题按当前语言生成
  function defaultViews(translator) {
    return [
      { title: translator.t('default.issues'), mode: 'search', value: 'is:issue user:@me state:open sort:updated-desc' },
      { title: translator.t('default.involvedIssues'), mode: 'search', value: 'is:issue involves:@me state:open sort:updated-desc' },
      { title: translator.t('default.pulls'), mode: 'search', value: 'is:pr user:@me state:open sort:updated-desc' },
      { title: translator.t('default.involvedPulls'), mode: 'search', value: 'is:pr involves:@me state:open archived:false sort:updated-desc' },
    ];
  }

  const MESSAGES = {
    zh: {
      'app.title': 'GitHub My Work',
      'app.launcher': '我的工作',
      'toolbar.helpShow': '显示提示',
      'toolbar.helpHide': '隐藏提示',
      'toolbar.settings': '设置',
      'toolbar.reload': '全部刷新',
      'toolbar.close': '关闭',
      'notice.summary': '如果某一列是空白，GitHub 可能阻止了 iframe 嵌入。配置 Header Ext 移除 github.com 的 X-Frame-Options 与 Content-Security-Policy 响应头。',
      'notice.help': 'Header Ext 帮助',
      'notice.detail': '移除这些响应头会降低页面安全性，请把规则限定在 GitHub，不用时关闭。',
      'notice.close': '关闭提示',
      'settings.title': '工作台设置',
      'settings.description': '每列可以填写 GitHub 搜索条件，或一个 github.com 页面地址。设置只保存在当前浏览器。',
      'settings.columnTitle': '第 {n} 列标题',
      'settings.titleLabel': '标题',
      'settings.mode': '类型',
      'settings.modeSearch': '搜索条件',
      'settings.modeUrl': '页面地址',
      'settings.valueSearch': 'GitHub 搜索条件',
      'settings.valueUrl': 'GitHub 页面地址',
      'settings.hintSearch': '示例：is:issue user:@me state:open sort:updated-desc',
      'settings.hintUrl': '必须以 https://github.com/ 开头',
      'settings.add': '添加一列',
      'settings.remove': '删除第 {n} 列',
      'settings.save': '保存并应用',
      'settings.restore': '恢复默认',
      'settings.cancel': '取消',
      'settings.language': '界面语言',
      'settings.languageAuto': '自动',
      'column.open': '打开 ↗',
      'column.fallbackTitle': '第 {n} 列',
      'default.issues': '我的 Issue',
      'default.involvedIssues': '我参与的 Issue',
      'default.pulls': '我的 PR',
      'default.involvedPulls': '我参与的 PR',
      'status.empty': '第 {n} 列还没有填写内容。',
      'status.invalidUrl': '第 {n} 列的地址必须以 https://github.com/ 开头。',
      'status.tooMany': '最多只能添加 {n} 列。',
      'status.saved': '已保存。',
      'status.saveFailed': '无法在当前浏览器保存设置。',
      'status.defaults': '已载入默认配置，点击“保存并应用”生效。',
    },
    en: {
      'app.title': 'GitHub My Work',
      'app.launcher': 'My Work',
      'toolbar.helpShow': 'Show help',
      'toolbar.helpHide': 'Hide help',
      'toolbar.settings': 'Settings',
      'toolbar.reload': 'Reload all',
      'toolbar.close': 'Close',
      'notice.summary': 'If a column is blank, GitHub may be blocking iframe embedding. Configure Header Ext to remove X-Frame-Options and Content-Security-Policy response headers for github.com.',
      'notice.help': 'Header Ext help',
      'notice.detail': 'Removing these protections reduces page security; limit the rules to GitHub and disable them when not needed.',
      'notice.close': 'Dismiss notice',
      'settings.title': 'Dashboard settings',
      'settings.description': 'Each column takes a GitHub search query or a github.com page URL. Settings are stored in this browser only.',
      'settings.columnTitle': 'Column {n} title',
      'settings.titleLabel': 'Title',
      'settings.mode': 'Type',
      'settings.modeSearch': 'Search query',
      'settings.modeUrl': 'Page URL',
      'settings.valueSearch': 'GitHub search query',
      'settings.valueUrl': 'GitHub page URL',
      'settings.hintSearch': 'Example: is:issue user:@me state:open sort:updated-desc',
      'settings.hintUrl': 'Must start with https://github.com/',
      'settings.add': 'Add column',
      'settings.remove': 'Remove column {n}',
      'settings.save': 'Save and apply',
      'settings.restore': 'Restore defaults',
      'settings.cancel': 'Cancel',
      'settings.language': 'Language',
      'settings.languageAuto': 'Auto',
      'column.open': 'Open ↗',
      'column.fallbackTitle': 'Column {n}',
      'default.issues': 'My Issues',
      'default.involvedIssues': 'Involved Issues',
      'default.pulls': 'My PRs',
      'default.involvedPulls': 'Involved PRs',
      'status.empty': 'Column {n} needs a value.',
      'status.invalidUrl': 'Column {n} must use a https://github.com/ URL.',
      'status.tooMany': 'At most {n} columns are supported.',
      'status.saved': 'Saved.',
      'status.saveFailed': 'Could not save settings in this browser.',
      'status.defaults': 'Defaults loaded. Click "Save and apply" to keep them.',
    },
  };

  // ---------- 纯工具函数 ----------

  function detectLanguage() {
    return /^zh\b/i.test(document.documentElement.lang || '') ||
      navigator.language.toLowerCase().startsWith('zh')
      ? 'zh'
      : 'en';
  }

  function el(tag, props = {}, init) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'attrs') {
        for (const [name, attrValue] of Object.entries(value)) node.setAttribute(name, attrValue);
      } else node[key] = value;
    }
    if (init) init(node);
    return node;
  }

  function normalizeUrl(value) {
    const trimmed = value.trim();
    if (!GITHUB_URL_PATTERN.test(trimmed)) return null;
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const url = new URL(withScheme);
      return url.protocol === 'https:' && /(^|\.)github\.com$/i.test(url.hostname) ? url.href : null;
    } catch {
      return null;
    }
  }

  // ---------- 语言 ----------

  class Translator {
    #lang;

    constructor(lang) {
      this.#lang = MESSAGES[lang] ? lang : 'en';
    }

    get lang() {
      return this.#lang;
    }

    setLanguage(lang) {
      if (!MESSAGES[lang] || lang === this.#lang) return false;
      this.#lang = lang;
      return true;
    }

    t(key, vars = {}) {
      const template = MESSAGES[this.#lang][key] ?? MESSAGES.en[key] ?? key;
      return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
    }
  }

  // ---------- 图标（iconify-icon web component，失败时退回文字） ----------

  class IconifyLoader {
    static #promise = null;

    static ensure() {
      if (window.customElements?.get('iconify-icon')) return Promise.resolve(true);
      if (IconifyLoader.#promise) return IconifyLoader.#promise;

      IconifyLoader.#promise = new Promise(resolve => {
        const script = el('script', { src: ICONIFY_SRC, async: true });
        script.addEventListener('load', () => resolve(Boolean(window.customElements.get('iconify-icon'))), { once: true });
        script.addEventListener('error', () => resolve(false), { once: true });
        document.head.append(script);
      });
      return IconifyLoader.#promise;
    }
  }

  // iconify 渲染失败时的降级图形：内嵌 lucide 图标数据（与 iconify 用同一套字形）
  class InlineGlyph {
    static #ICONS = {
      'lucide:circle-help': [
        ['circle', { cx: '12', cy: '12', r: '10' }],
        ['path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01' }],
      ],
      'lucide:x': [['path', { d: 'M18 6L6 18M6 6l12 12' }]],
      'lucide:plus': [['path', { d: 'M5 12h14m-7-7v14' }]],
      'lucide:trash-2': [
        ['path', { d: 'M10 11v6m4-6v6m5-11v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }],
      ],
    };

    static create(name) {
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('aria-hidden', 'true');
      for (const [tag, attributes] of InlineGlyph.#ICONS[name] ?? InlineGlyph.#ICONS['lucide:circle-help']) {
        const node = document.createElementNS(NS, tag);
        for (const [attribute, value] of Object.entries(attributes)) node.setAttribute(attribute, value);
        svg.append(node);
      }
      return svg;
    }
  }

  class Icon {
    // 图标交给 iconify web component 渲染；github.com 自带一份不完整的 iconify 缓存，
    // 组件在上面有时取不到图标，超时后降级为 InlineGlyph
    static #POLL_INTERVAL = 1000;
    static #POLL_LIMIT = 4000;

    element;

    #iconify;

    constructor(name) {
      this.element = el('span', { class: 'gmw-icon' });
      this.#iconify = el('iconify-icon', { attrs: { icon: name, 'aria-hidden': 'true' } });
      this.element.append(this.#iconify);

      let waited = 0;
      const poll = () => {
        if (this.#rendered()) return;
        waited += Icon.#POLL_INTERVAL;
        if (waited < Icon.#POLL_LIMIT) {
          window.setTimeout(poll, Icon.#POLL_INTERVAL);
          return;
        }
        this.element.replaceChildren(InlineGlyph.create(name));
      };
      window.setTimeout(poll, Icon.#POLL_INTERVAL);
    }

    #rendered() {
      return Boolean(this.#iconify.shadowRoot?.querySelector('svg'));
    }
  }

  // ---------- 设置 ----------

  class Settings {
    #state = { language: 'auto', noticeDismissed: false, views: null };

    load() {
      const raw = this.#readRaw();
      if (raw && typeof raw === 'object' && Array.isArray(raw.views)) {
        this.#state = {
          language: raw.language === 'zh' || raw.language === 'en' ? raw.language : 'auto',
          noticeDismissed: raw.noticeDismissed === true,
          views: raw.views,
        };
        return this;
      }
      // 兼容 1.0 的纯数组格式
      const legacy = this.#readLegacy();
      if (legacy) {
        this.#state.views = legacy.map((view, index) => ({
          title: String(view?.title ?? ''),
          mode: 'search',
          value: String(view?.query ?? ''),
          index,
        }));
      }
      return this;
    }

    #readRaw() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      } catch (error) {
        console.warn('[GitHub My Work] Could not read settings:', error);
        return null;
      }
    }

    #readLegacy() {
      try {
        const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) ?? 'null');
        return Array.isArray(legacy) && legacy.length ? legacy : null;
      } catch {
        return null;
      }
    }

    get language() {
      return this.#state.language;
    }

    set language(value) {
      this.#state.language = value;
    }

    get noticeDismissed() {
      return this.#state.noticeDismissed;
    }

    set noticeDismissed(value) {
      this.#state.noticeDismissed = Boolean(value);
    }

    get views() {
      return this.#state.views;
    }

    set views(views) {
      this.#state.views = views;
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          version: 2,
          language: this.#state.language,
          noticeDismissed: this.#state.noticeDismissed,
          views: this.#state.views,
        }));
        return true;
      } catch (error) {
        console.warn('[GitHub My Work] Could not save settings:', error);
        return false;
      }
    }
  }

  // ---------- 单列 ----------

  class ColumnView {
    element;
    frame;

    #title;
    #openLink;
    #translator;
    #mode = 'search';
    #src = '';
    #dark = false;

    constructor(translator) {
      this.#translator = translator;

      this.#title = el('strong', { class: 'gmw-column-title' });
      this.#openLink = el('a', { class: 'gmw-column-open', target: '_blank', rel: 'noopener noreferrer' });

      const heading = el('div', { class: 'gmw-heading' }, node => {
        node.append(this.#title, this.#openLink);
      });

      this.frame = el('iframe', { loading: 'lazy', referrerPolicy: 'strict-origin-when-cross-origin' });
      this.frame.addEventListener('load', () => this.#trimFrame());

      this.element = el('section', { class: 'gmw-column' }, node => {
        node.append(heading, this.frame);
      });
    }

    setView(view, index) {
      const title = (view.title || '').trim() || this.#translator.t('column.fallbackTitle', { n: index + 1 });
      this.#title.textContent = title;
      this.frame.title = title;

      this.#mode = view.mode === 'url' ? 'url' : 'search';
      const src = this.#mode === 'url' ? view.value : `${SEARCH_URL_PREFIX}${encodeURIComponent(view.value)}`;
      this.#openLink.href = src;
      this.#openLink.textContent = this.#translator.t('column.open');

      if (src !== this.#src) {
        this.#src = src;
        this.frame.src = src;
      }
    }

    retranslate() {
      this.#openLink.textContent = this.#translator.t('column.open');
    }

    // 让 iframe 里的 GitHub 跟随外层页面的明暗主题
    setTheme(isDark) {
      this.#dark = isDark;
      this.#applyFrameTheme();
    }

    #applyFrameTheme() {
      try {
        const root = this.frame.contentDocument?.documentElement;
        if (root) root.setAttribute('data-color-mode', this.#dark ? 'dark' : 'light');
      } catch {
        // 跨域或文档尚未就绪时忽略
      }
    }

    // 只保留 PageLayout.Content，去掉每个 iframe 里重复的 GitHub 头部、侧栏和页脚
    #trimFrame() {
      this.#applyFrameTheme();
      if (this.#mode !== 'search') return;
      let doc = null;
      try {
        doc = this.frame.contentDocument;
      } catch {
        return;
      }
      if (!doc) return;

      for (const delay of [0, 300, 900, 2000]) {
        window.setTimeout(() => this.#applyTrim(doc), delay);
      }
    }

    #applyTrim(doc) {
      try {
        if (!doc?.body) return;
        this.#applyFrameTheme();
        const content = doc.querySelector('[data-component="PageLayout.Content"]');
        if (!content) return;

        const style = doc.getElementById('gmw-frame-style') ?? this.#createFrameStyle(doc);
        if (!style.isConnected) doc.head.append(style);

        let node = content;
        while (node && node.parentElement && node !== doc.body) {
          const parent = node.parentElement;
          for (const sibling of parent.children) {
            if (sibling === node || sibling === style) continue;
            if (sibling.tagName === 'SCRIPT' || sibling.tagName === 'STYLE' || sibling.tagName === 'LINK') continue;
            sibling.style.display = 'none';
          }
          node = parent;
        }
      } catch (error) {
        console.warn('[GitHub My Work] Could not trim iframe:', error);
      }
    }

    #createFrameStyle(doc) {      const style = el('style', { id: 'gmw-frame-style' });
      style.textContent = `
        html, body { min-height: 0 !important; }
        body { overflow-x: hidden !important; }
        [data-component="PageLayout.Content"],
        [data-component="PageLayout.Content"] > * { min-height: 0 !important; }
        [data-component="PageLayout.Content"] { padding-top: 0 !important; }
      `;
      return style;
    }
  }

  // ---------- 提示条 ----------

  class NoticeBar {
    element;

    #translator;
    #summary;
    #detail;
    #helpLink;
    #dismiss;

    constructor(translator, onDismiss) {
      this.#translator = translator;

      this.#summary = el('span', { class: 'gmw-notice-summary' });
      this.#detail = el('span', { class: 'gmw-notice-detail' });
      this.#helpLink = el('a', { target: '_blank', rel: 'noopener noreferrer', href: 'https://github.com/binge6/header-ext' });

      this.#dismiss = el('button', { class: 'gmw-icon-button', type: 'button' }, node => {
        node.append(new Icon('lucide:x').element);
        node.addEventListener('click', () => onDismiss());
      });

      this.element = el('div', { class: 'gmw-notice', attrs: { role: 'note' } }, node => {
        node.append(el('div', { class: 'gmw-notice-text' }, text => {
          text.append(this.#summary, ' ', this.#helpLink, ' ', this.#detail);
        }), this.#dismiss);
      });

      this.retranslate();
    }

    setVisible(visible) {
      this.element.hidden = !visible;
    }

    get visible() {
      return !this.element.hidden;
    }

    retranslate() {
      this.#summary.textContent = this.#translator.t('notice.summary');
      this.#helpLink.textContent = this.#translator.t('notice.help');
      this.#detail.textContent = this.#translator.t('notice.detail');
      this.#dismiss.setAttribute('aria-label', this.#translator.t('notice.close'));
      this.#dismiss.title = this.#translator.t('notice.close');
    }
  }

  // ---------- 设置表单：一行 ----------

  class ViewRow {
    element;

    #translator;
    #index = 0;
    #indexLabel;
    #titleLabel;
    #titleInput;
    #modeLabel;
    #modeSelect;
    #valueLabel;
    #valueInput;
    #hint;
    #removeButton;

    constructor(translator, onChange, onRemove) {
      this.#translator = translator;

      this.#indexLabel = el('strong', { class: 'gmw-view-row-index' });
      this.#titleLabel = el('label', { class: 'gmw-field-label' });
      this.#titleInput = el('input', { type: 'text', maxLength: 60 });

      this.#modeLabel = el('label', { class: 'gmw-field-label' });
      this.#modeSelect = el('select');
      this.#modeSelect.append(
        el('option', { value: 'search' }),
        el('option', { value: 'url' }),
      );

      this.#valueLabel = el('label', { class: 'gmw-field-label' });
      this.#valueInput = el('textarea', { rows: 3, maxLength: 500 });
      this.#hint = el('p', { class: 'gmw-field-hint' });
      this.#removeButton = el('button', { type: 'button', class: 'gmw-row-remove' }, node => {
        node.append(new Icon('lucide:trash-2').element);
        node.addEventListener('click', () => onRemove(this));
      });

      const titleField = el('div', { class: 'gmw-field' }, node => {
        node.append(this.#titleLabel, this.#titleInput);
      });
      const modeField = el('div', { class: 'gmw-field gmw-field-mode' }, node => {
        node.append(this.#modeLabel, this.#modeSelect);
      });
      const valueField = el('div', { class: 'gmw-field gmw-field-value' }, node => {
        node.append(this.#valueLabel, this.#valueInput, this.#hint);
      });

      this.element = el('div', { class: 'gmw-view-row' }, node => {
        node.append(
          el('div', { class: 'gmw-view-row-head' }, head => {
            head.append(this.#indexLabel, el('span', { class: 'gmw-spacer' }), this.#removeButton);
          }),
          el('div', { class: 'gmw-view-row-body' }, body => body.append(titleField, modeField, valueField)),
        );
      });

      this.#titleInput.addEventListener('input', () => onChange());
      this.#modeSelect.addEventListener('change', () => {
        this.#applyMode();
        onChange();
      });
      this.#valueInput.addEventListener('input', () => onChange());

      this.retranslate();
      this.#applyMode();
    }

    setIndex(index, canRemove) {
      this.#index = index;
      this.#removeButton.disabled = !canRemove;
      this.#titleInput.id = `gmw-title-${index}`;
      this.#titleInput.setAttribute('aria-label', this.#translator.t('settings.columnTitle', { n: index + 1 }));
      this.#modeSelect.setAttribute('aria-label', `${this.#translator.t('settings.mode')} ${index + 1}`);
      this.#valueInput.id = `gmw-query-${index}`;
      this.retranslate();
      this.#applyMode();
    }

    setView(view) {
      this.#titleInput.value = view.title ?? '';
      this.#modeSelect.value = view.mode === 'url' ? 'url' : 'search';
      this.#valueInput.value = view.value ?? '';
      this.#applyMode();
    }

    read() {
      return {
        title: this.#titleInput.value.trim(),
        mode: this.#modeSelect.value === 'url' ? 'url' : 'search',
        value: this.#valueInput.value.trim(),
      };
    }

    focusValue() {
      this.#valueInput.focus();
    }

    retranslate() {
      this.#indexLabel.textContent = this.#translator.t('settings.columnTitle', { n: this.#index + 1 });
      this.#titleLabel.textContent = this.#translator.t('settings.titleLabel');
      this.#modeLabel.textContent = this.#translator.t('settings.mode');
      this.#valueLabel.textContent =
        this.#modeSelect.value === 'url'
          ? this.#translator.t('settings.valueUrl')
          : this.#translator.t('settings.valueSearch');
      this.#hint.textContent =
        this.#modeSelect.value === 'url'
          ? this.#translator.t('settings.hintUrl')
          : this.#translator.t('settings.hintSearch');
      this.#modeSelect.options[0].textContent = this.#translator.t('settings.modeSearch');
      this.#modeSelect.options[1].textContent = this.#translator.t('settings.modeUrl');
      this.#removeButton.setAttribute('aria-label', this.#translator.t('settings.remove', { n: this.#index + 1 }));
      this.#removeButton.title = this.#removeButton.getAttribute('aria-label');
    }

    #applyMode() {
      const isUrl = this.#modeSelect.value === 'url';
      this.#valueInput.placeholder = isUrl
        ? 'https://github.com/shijianjs/userscripts/issues'
        : 'is:issue user:@me state:open sort:updated-desc';
      this.retranslate();
    }
  }

  // ---------- 设置面板 ----------

  class SettingsEditor {
    element;

    #translator;
    #rows = [];
    #handlers;
    #list;
    #addButton;
    #addLabel;
    #languageSelect;
    #languageLabel;
    #title;
    #description;

    constructor(translator, handlers) {
      this.#translator = translator;
      this.#handlers = handlers;

      this.#title = el('h2');
      this.#description = el('p', { class: 'gmw-settings-description' });
      this.#list = el('div', { class: 'gmw-view-list' });

      this.#addLabel = el('span', { class: 'gmw-add-label' });
      this.#addButton = el('button', { type: 'button', class: 'gmw-add-column' }, node => {
        node.append(new Icon('lucide:plus').element, this.#addLabel);
        node.addEventListener('click', () => handlers.onAdd());
      });

      this.#languageLabel = el('label', { class: 'gmw-field-label' });
      this.#languageSelect = el('select', {}, node => {
        node.append(
          el('option', { value: 'auto' }),
          el('option', { value: 'zh', text: '中文' }),
          el('option', { value: 'en', text: 'English' }),
        );
      });

      this.element = el('section', { class: 'gmw-settings' }, node => {
        node.append(
          this.#title,
          this.#description,
          el('div', { class: 'gmw-language-row' }, row => {
            row.append(this.#languageLabel, this.#languageSelect);
          }),
          this.#list,
          el('div', { class: 'gmw-add-row' }, row => row.append(this.#addButton)),
        );
      });

      this.retranslate();
    }

    get language() {
      return this.#languageSelect.value;
    }

    open(views, language) {
      this.setViews(views);
      this.#languageSelect.value = language;
      this.#handlers.onStatus('');
    }

    setViews(views) {
      while (this.#rows.length > views.length) {
        const row = this.#rows.pop();
        row.element.remove();
      }
      while (this.#rows.length < views.length) {
        this.#rows.push(new ViewRow(
          this.#translator,
          () => this.#handlers.onStatus(''),
          row => this.#removeRow(row),
        ));
        this.#list.append(this.#rows[this.#rows.length - 1].element);
      }
      this.#rows.forEach((row, index) => {
        row.setView(views[index]);
        row.setIndex(index, views.length > 1);
        if (index >= MAX_COLUMNS) row.element.hidden = true;
      });
      this.#refreshAddButton();
    }

    addEmptyView() {
      if (this.#rows.length >= MAX_COLUMNS) {
        this.#handlers.onStatus(this.#translator.t('status.tooMany', { n: MAX_COLUMNS }));
        return;
      }
      const row = new ViewRow(this.#translator, () => this.#handlers.onStatus(''), item => this.#removeRow(item));
      this.#rows.push(row);
      this.#list.append(row.element);
      row.setIndex(this.#rows.length - 1, true);
      row.element.hidden = false;
      this.#handlers.onStatus('');
      this.#refreshAddButton();
      row.focusValue();
    }

    read() {
      return this.#rows.filter(row => !row.element.hidden).map(row => row.read());
    }

    validate() {
      const views = this.read();
      for (const [index, view] of views.entries()) {
        if (!view.value) return { key: 'status.empty', index };
        if (view.mode === 'url' && !normalizeUrl(view.value)) return { key: 'status.invalidUrl', index };
      }
      return null;
    }

    focusRow(index) {
      this.#rows[index]?.focusValue();
    }

    retranslate() {
      this.#title.textContent = this.#translator.t('settings.title');
      this.#description.textContent = this.#translator.t('settings.description');
      this.#languageLabel.textContent = this.#translator.t('settings.language');
      this.#languageSelect.options[0].textContent = this.#translator.t('settings.languageAuto');
      this.#addLabel.textContent = this.#translator.t('settings.add');
      this.#rows.forEach((row, index) => {
        row.setIndex(index, this.#rows.length > 1);
      });
    }

    #removeRow(row) {
      if (this.#rows.length <= 1) return;
      this.#rows = this.#rows.filter(item => item !== row);
      row.element.remove();
      this.#rows.forEach((item, index) => item.setIndex(index, this.#rows.length > 1));
      this.#handlers.onStatus('');
      this.#refreshAddButton();
    }

    #refreshAddButton() {
      const visible = this.#rows.filter(item => !item.element.hidden).length;
      this.#addButton.disabled = visible >= MAX_COLUMNS;
    }
  }

  // ---------- 主面板 ----------

  class Dashboard {
    element;
    launcher;

    #translator;
    #settings;
    #notice;
    #columns;
    #columnViews = [];
    #dark = false;
    #toolbarTitle;
    #helpButton;
    #settingsButton;
    #reloadButton;
    #closeButton;
    #settingsActions;
    #status;
    #saveButton;
    #restoreButton;
    #cancelButton;
    #editor;
    #panelOpen = false;

    constructor(translator, settings) {
      this.#translator = translator;
      this.#settings = settings;

      this.launcher = el('button', { id: 'gmw-launcher', type: 'button' });
      this.launcher.addEventListener('click', () => this.open());

      this.#notice = new NoticeBar(translator, () => this.dismissNotice());
      this.#columns = el('div', { id: 'gmw-columns' });

      this.#toolbarTitle = el('strong', { class: 'gmw-toolbar-title' });
      this.#helpButton = el('button', { type: 'button', class: 'gmw-icon-button' }, node => {
        node.append(new Icon('lucide:circle-help').element);
        node.addEventListener('click', () => this.toggleNotice());
      });
      this.#settingsButton = el('button', { type: 'button' }, node => {
        node.addEventListener('click', () => this.openSettings());
      });
      this.#reloadButton = el('button', { type: 'button' }, node => {
        node.addEventListener('click', () => this.reloadFrames());
      });
      // 关闭按钮是全局的，随手可用，所以用图标放在最右侧
      this.#closeButton = el('button', { type: 'button', class: 'gmw-icon-button' }, node => {
        node.append(new Icon('lucide:x').element);
        node.addEventListener('click', () => this.close());
      });

      // 设置页自己的操作按钮顶到工具栏，替换设置页期间用不到的三个按钮
      this.#status = el('span', { class: 'gmw-settings-status' });
      this.#settingsActions = el('div', { class: 'gmw-toolbar-actions', attrs: { hidden: '' } }, node => {
        const save = el('button', { type: 'button', class: 'gmw-primary' }, button => {
          button.addEventListener('click', () => this.saveSettings());
        });
        const restore = el('button', { type: 'button' }, button => {
          button.addEventListener('click', () => this.restoreDefaults());
        });
        const cancel = el('button', { type: 'button' }, button => {
          button.addEventListener('click', () => this.hideSettings());
        });
        node.append(this.#status, save, restore, cancel);
        this.#saveButton = save;
        this.#restoreButton = restore;
        this.#cancelButton = cancel;
      });

      this.#editor = new SettingsEditor(translator, {
        onAdd: () => this.#editor.addEmptyView(),
        onStatus: text => this.setStatus(text),
      });

      this.element = el('section', { id: 'gmw-panel', class: 'gmw-panel' }, node => {
        node.append(
          el('div', { class: 'gmw-toolbar' }, toolbar => {
            toolbar.append(
              this.#toolbarTitle,
              el('span', { class: 'gmw-spacer' }),
              this.#helpButton,
              this.#settingsButton,
              this.#reloadButton,
              this.#settingsActions,
              this.#closeButton,
            );
          }),
          el('div', { class: 'gmw-body' }, body => {
            body.append(this.#notice.element, this.#columns, this.#editor.element);
          }),
        );
      });

      this.retranslate();
    }

    mount(host) {
      host.append(this.launcher, this.element);
      this.#notice.setVisible(!this.#settings.noticeDismissed);
      this.setViews(this.#settings.views);
    }

    setViews(views) {
      while (this.#columnViews.length > views.length) {
        this.#columnViews.pop().element.remove();
      }
      while (this.#columnViews.length < views.length) {
        const column = new ColumnView(this.#translator);
        column.setTheme(this.#dark);
        this.#columnViews.push(column);
        this.#columns.append(column.element);
      }
      this.#columns.style.setProperty('--gmw-columns', String(views.length));
      this.#columnViews.forEach((column, index) => column.setView(views[index], index));
    }

    open() {
      this.#panelOpen = true;
      this.element.classList.add('gmw-open');
      this.launcher.hidden = true;
    }

    close() {
      this.#panelOpen = false;
      this.element.classList.remove('gmw-open');
      this.launcher.hidden = false;
      this.hideSettings();
    }

    get panelOpen() {
      return this.#panelOpen;
    }

    openSettings() {
      this.#editor.open(this.#settings.views, this.#settings.language);
      this.#editor.element.classList.add('gmw-visible');
      this.#settingsActions.hidden = false;
      this.#helpButton.hidden = true;
      this.#settingsButton.hidden = true;
      this.#reloadButton.hidden = true;
    }

    hideSettings() {
      this.#editor.element.classList.remove('gmw-visible');
      this.#settingsActions.hidden = true;
      this.#helpButton.hidden = false;
      this.#settingsButton.hidden = false;
      this.#reloadButton.hidden = false;
    }

    setStatus(text) {
      this.#status.textContent = text;
      this.#status.title = text;
    }

    get settingsOpen() {
      return this.#editor.element.classList.contains('gmw-visible');
    }

    saveSettings() {
      const invalid = this.#editor.validate();
      if (invalid) {
        this.setStatus(this.#translator.t(invalid.key, { n: invalid.index + 1 }));
        this.#editor.focusRow(invalid.index);
        return;
      }

      const views = this.#editor.read().map((view, index) => ({
        title: view.title || this.#translator.t('column.fallbackTitle', { n: index + 1 }),
        mode: view.mode,
        value: view.mode === 'url' ? normalizeUrl(view.value) : view.value,
      }));

      this.#settings.views = views;
      this.#settings.language = this.#editor.language;
      this.#translator.setLanguage(
        this.#settings.language === 'auto' ? detectLanguage() : this.#settings.language,
      );
      if (!this.#settings.save()) {
        this.setStatus(this.#translator.t('status.saveFailed'));
        return;
      }

      this.#applyLanguage();
      this.setViews(views);
      this.setStatus(this.#translator.t('status.saved'));
      this.hideSettings();
    }

    restoreDefaults() {
      const language = this.#editor.language === 'auto' ? detectLanguage() : this.#editor.language;
      const translator = this.#translator.lang === language ? this.#translator : new Translator(language);
      this.#editor.setViews(defaultViews(translator));
      this.setStatus(this.#translator.t('status.defaults'));
    }

    reloadFrames() {
      this.#columnViews.forEach(column => {
        const src = column.frame.src;
        column.frame.src = src;
      });
    }

    dismissNotice() {
      this.#notice.setVisible(false);
      this.#settings.noticeDismissed = true;
      this.#settings.save();
      this.retranslate();
    }

    toggleNotice() {
      const visible = !this.#notice.visible;
      this.#notice.setVisible(visible);
      this.#settings.noticeDismissed = !visible;
      this.#settings.save();
      this.retranslate();
    }

    setTheme(isDark) {
      this.#dark = isDark;
      this.element.dataset.theme = isDark ? 'dark' : 'light';
      this.#columnViews.forEach(column => column.setTheme(isDark));
    }
    #applyLanguage() {
      this.retranslate();
      this.#columnViews.forEach(column => column.retranslate());
      this.#editor.retranslate();
    }

    retranslate() {
      this.launcher.textContent = this.#translator.t('app.launcher');
      this.#toolbarTitle.textContent = this.#translator.t('app.title');
      const helpLabel = this.#notice.visible
        ? this.#translator.t('toolbar.helpHide')
        : this.#translator.t('toolbar.helpShow');
      this.#helpButton.setAttribute('aria-label', helpLabel);
      this.#helpButton.title = helpLabel;
      this.#settingsButton.textContent = this.#translator.t('toolbar.settings');
      this.#reloadButton.textContent = this.#translator.t('toolbar.reload');
      this.#saveButton.textContent = this.#translator.t('settings.save');
      this.#restoreButton.textContent = this.#translator.t('settings.restore');
      this.#cancelButton.textContent = this.#translator.t('settings.cancel');
      this.#closeButton.setAttribute('aria-label', this.#translator.t('toolbar.close'));
      this.#closeButton.title = this.#translator.t('toolbar.close');
      this.#notice.retranslate();
    }
  }

  // ---------- 应用入口 ----------

  class App {
    #translator;
    #settings;
    #dashboard;
    #host;

    constructor() {
      this.#settings = new Settings().load();

      const storedLanguage = this.#settings.language;
      this.#translator = new Translator(storedLanguage === 'auto' ? detectLanguage() : storedLanguage);

      if (!this.#settings.views) {
        this.#settings.views = defaultViews(this.#translator);
      }

      this.#dashboard = new Dashboard(this.#translator, this.#settings);
    }

    mount() {
      IconifyLoader.ensure();

      const style = el('style');
      style.textContent = STYLES;
      this.#host = el('gmw-app', { attrs: { 'data-theme': 'light' } });
      const shadow = this.#host.attachShadow({ mode: 'open' });
      shadow.append(style);
      this.#dashboard.mount(shadow);
      document.body.append(this.#host);

      this.#applyTheme();
      this.#observeTheme();
      this.#bindKeys();
    }

    #applyTheme() {
      const mode = document.documentElement.getAttribute('data-color-mode');
      const isDark = mode === 'dark'
        ? true
        : mode === 'light'
          ? false
          : window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.#host.setAttribute('data-theme', isDark ? 'dark' : 'light');
      this.#dashboard.setTheme(isDark);
    }

    #observeTheme() {
      new MutationObserver(() => this.#applyTheme()).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-color-mode', 'data-light-theme', 'data-dark-theme'],
      });

      const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => this.#applyTheme();
      if (colorScheme.addEventListener) colorScheme.addEventListener('change', listener);
      else if (colorScheme.addListener) colorScheme.addListener(listener);
    }

    #bindKeys() {
      document.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || !this.#dashboard.panelOpen) return;
        if (this.#dashboard.settingsOpen) {
          this.#dashboard.hideSettings();
        } else {
          this.#dashboard.close();
        }
      });
    }
  }

  const STYLES = `
    :host {
      --gmw-bg: #ffffff;
      --gmw-panel-bg: #f6f8fa;
      --gmw-fg: #1f2328;
      --gmw-muted: #59636e;
      --gmw-border: #d1d9e0;
      --gmw-link: #0969da;
      --gmw-accent: #1f883d;
      --gmw-accent-fg: #ffffff;
      --gmw-input-bg: #ffffff;
      --gmw-warning-bg: #fff8c5;
      --gmw-warning-fg: #5d4a00;
      --gmw-icon-size: 16px;

      display: contents;
    }

    :host([data-theme="dark"]) {
      --gmw-bg: #0d1117;
      --gmw-panel-bg: #161b22;
      --gmw-fg: #e6edf3;
      --gmw-muted: #9198a1;
      --gmw-border: #30363d;
      --gmw-link: #58a6ff;
      --gmw-accent: #238636;
      --gmw-accent-fg: #ffffff;
      --gmw-input-bg: #0d1117;
      --gmw-warning-bg: #2d2500;
      --gmw-warning-fg: #f0d66b;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    [hidden] {
      display: none !important;
    }

    #gmw-launcher {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 2147483000;
      padding: 10px 16px;
      border: 1px solid var(--gmw-accent);
      border-radius: 8px;
      background: var(--gmw-accent);
      color: var(--gmw-accent-fg);
      font: 600 14px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      cursor: pointer;
      box-shadow: 0 2px 10px #0002;
    }

    #gmw-launcher[hidden] {
      display: none;
    }

    .gmw-panel {
      position: fixed;
      inset: 0;
      z-index: 2147482999;
      display: none;
      flex-direction: column;
      background: var(--gmw-bg);
      color: var(--gmw-fg);
      font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color-scheme: light;
    }

    .gmw-panel[data-theme="dark"] {
      color-scheme: dark;
    }

    .gmw-panel.gmw-open {
      display: flex;
    }

    .gmw-toolbar {
      min-height: 52px;
      flex: 0 0 auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      border-bottom: 1px solid var(--gmw-border);
      background: var(--gmw-panel-bg);
    }

    .gmw-toolbar-title {
      font-size: 16px;
      white-space: nowrap;
    }

    .gmw-spacer {
      flex: 1;
    }

    .gmw-toolbar button,
    .gmw-settings button,
    .gmw-view-row button {
      padding: 6px 10px;
      border: 1px solid var(--gmw-border);
      border-radius: 6px;
      background: var(--gmw-bg);
      color: var(--gmw-fg);
      font: inherit;
      cursor: pointer;
      white-space: nowrap;
    }

    .gmw-toolbar button:hover,
    .gmw-settings button:hover,
    .gmw-view-row button:hover {
      filter: brightness(0.96);
    }

    .gmw-icon-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 5px 8px !important;
    }

    .gmw-icon {
      display: inline-flex;
      align-items: center;
      font-size: var(--gmw-icon-size);
      color: currentColor;
      line-height: 1;
    }

    .gmw-icon svg {
      display: block;
      width: 1em;
      height: 1em;
    }

    .gmw-notice {
      flex: 0 0 auto;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 14px;
      border-bottom: 1px solid var(--gmw-border);
      background: var(--gmw-warning-bg);
      color: var(--gmw-warning-fg);
      font-size: 12px;
    }

    .gmw-notice[hidden] {
      display: none;
    }

    .gmw-notice-text {
      flex: 1;
    }

    .gmw-notice a {
      color: inherit;
      text-decoration: underline;
    }

    .gmw-notice-detail {
      display: block;
      margin-top: 4px;
      opacity: 0.85;
    }

    .gmw-notice button {
      border: 1px solid transparent;
      background: transparent;
      color: inherit;
      padding: 2px 4px;
      border-radius: 4px;
      cursor: pointer;
      line-height: 1;
    }

    .gmw-notice button:hover {
      border-color: currentColor;
    }

    #gmw-columns {
      display: grid;
      grid-template-columns: repeat(var(--gmw-columns, 4), minmax(300px, 1fr));
      gap: 8px;
      padding: 8px;
      flex: 1 1 auto;
      min-height: 0;
      overflow-x: auto;
      overflow-y: hidden;
      background: var(--gmw-bg);
    }

    .gmw-column {
      display: flex;
      flex-direction: column;
      min-width: 300px;
      min-height: 0;
      overflow: hidden;
      border: 1px solid var(--gmw-border);
      border-radius: 6px;
      background: var(--gmw-bg);
    }

    .gmw-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 9px 10px;
      border-bottom: 1px solid var(--gmw-border);
      background: var(--gmw-panel-bg);
    }

    .gmw-column-title {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .gmw-column-open {
      color: var(--gmw-link);
      text-decoration: none;
      white-space: nowrap;
    }

    .gmw-column-open:hover {
      text-decoration: underline;
    }

    .gmw-column iframe {
      display: block;
      width: 100%;
      flex: 1 1 auto;
      min-height: 0;
      border: 0;
      background: var(--gmw-bg);
    }

    .gmw-body {
      position: relative;
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
    }

    .gmw-settings {
      display: none;
      position: absolute;
      inset: 0;
      z-index: 2;
      overflow: auto;
      padding: 20px;
      background: var(--gmw-bg);
    }

    .gmw-settings.gmw-visible {
      display: block;
    }

    .gmw-settings h2 {
      margin: 0 0 8px;
      font-size: 20px;
    }

    .gmw-settings-description {
      margin: 0 0 16px;
      max-width: 900px;
      color: var(--gmw-muted);
    }

    .gmw-language-row {
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 420px;
      margin-bottom: 16px;
    }

    .gmw-language-row .gmw-field-label {
      white-space: nowrap;
    }

    .gmw-language-row select {
      min-width: 180px;
    }

    .gmw-view-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(360px, 100%), 1fr));
      gap: 14px;
      align-items: start;
    }

    .gmw-view-row {
      display: grid;
      gap: 10px;
      margin: 0;
      padding: 12px 14px 14px;
      border: 1px solid var(--gmw-border);
      border-radius: 8px;
      background: var(--gmw-panel-bg);
    }

    .gmw-view-row-head {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .gmw-view-row-index {
      font-size: 13px;
    }

    .gmw-view-row-body {
      display: grid;
      grid-template-columns: minmax(120px, 1fr) minmax(120px, 150px);
      gap: 10px 12px;
      align-items: start;
    }

    .gmw-view-row-body .gmw-field-value {
      grid-column: 1 / -1;
    }

    .gmw-field {
      display: flex;
      flex-direction: column;
      gap: 5px;
      min-width: 0;
    }

    .gmw-field-label {
      font-weight: 600;
      font-size: 12px;
      color: var(--gmw-muted);
    }

    .gmw-field input,
    .gmw-field textarea,
    .gmw-field select,
    .gmw-language-row select {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid var(--gmw-border);
      border-radius: 6px;
      background: var(--gmw-input-bg);
      color: var(--gmw-fg);
      font: inherit;
    }

    .gmw-field textarea {
      min-height: 66px;
      resize: vertical;
    }

    .gmw-field-hint {
      margin: 0;
      font-size: 12px;
      color: var(--gmw-muted);
    }

    .gmw-row-remove {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px !important;
    }

    .gmw-row-remove:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .gmw-add-row {
      margin: 14px 0;
    }

    .gmw-add-column {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .gmw-toolbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .gmw-toolbar-actions[hidden] {
      display: none;
    }

    .gmw-toolbar .gmw-primary {
      background: var(--gmw-accent);
      border-color: var(--gmw-accent);
      color: var(--gmw-accent-fg);
    }

    .gmw-settings-status {
      max-width: 32ch;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
      color: var(--gmw-muted);
    }

    @media (max-width: 700px) {
      .gmw-toolbar {
        gap: 6px;
        padding: 8px;
      }

      .gmw-toolbar-title {
        font-size: 14px;
      }

      .gmw-toolbar button {
        padding: 5px 7px;
        font-size: 12px;
      }

      .gmw-notice {
        padding: 7px 9px;
      }

      #gmw-columns {
        grid-template-columns: repeat(var(--gmw-columns, 4), minmax(280px, 85vw));
      }

      .gmw-view-row-body {
        grid-template-columns: 1fr;
      }
    }
  `;

  new App().mount();
})();
