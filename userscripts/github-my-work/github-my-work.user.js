// ==UserScript==
// @name         GitHub My Work - 4-Column Dashboard
// @namespace    https://github.com/shijianjs/userscripts
// @version      1.0.0
// @description  A configurable four-column dashboard for your GitHub Issues and pull requests.
// @author       shijianjs
// @license      MIT
// @match        https://github.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  if (window.top !== window.self) return;
  if (document.getElementById('gmw-launcher')) return;

  const STORAGE_KEY = 'github-my-work.settings.v1';

  const DEFAULT_VIEWS = [
    {
      title: 'My Issues',
      query: 'is:issue user:@me state:open sort:updated-desc'
    },
    {
      title: 'Involved Issues',
      query: 'is:issue involves:@me state:open sort:updated-desc'
    },
    {
      title: 'My PRs',
      query: 'is:pr user:@me state:open sort:updated-desc'
    },
    {
      title: 'Involved PRs',
      query: 'is:pr involves:@me state:open archived:false sort:updated-desc'
    }
  ];

  function loadViews() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length === 4) {
        return DEFAULT_VIEWS.map((fallback, index) => ({
          title: String(saved[index]?.title || fallback.title).slice(0, 60),
          query: String(saved[index]?.query || fallback.query).slice(0, 500)
        }));
      }
    } catch (error) {
      console.warn('[GitHub My Work] Could not load saved settings:', error);
    }
    return DEFAULT_VIEWS.map(view => ({ ...view }));
  }

  let views = loadViews();
  let frames = [];

  const style = document.createElement('style');
  style.textContent = `
    #gmw-launcher, #gmw-panel, #gmw-panel * {
      box-sizing: border-box;
    }

    #gmw-launcher {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 999999;
      padding: 10px 16px;
      border: 1px solid var(--gmw-border);
      border-radius: 8px;
      background: var(--gmw-accent);
      color: #fff;
      font: 600 14px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      cursor: pointer;
      box-shadow: 0 2px 10px #0002;
    }

    #gmw-panel {
      --gmw-bg: #ffffff;
      --gmw-panel-bg: #f6f8fa;
      --gmw-fg: #1f2328;
      --gmw-muted: #59636e;
      --gmw-border: #d1d9e0;
      --gmw-link: #0969da;
      --gmw-accent: #1f883d;
      --gmw-input-bg: #ffffff;
      --gmw-warning-bg: #fff8c5;
      --gmw-warning-fg: #5d4a00;

      position: fixed;
      inset: 0;
      z-index: 999998;
      display: none;
      flex-direction: column;
      background: var(--gmw-bg);
      color: var(--gmw-fg);
      font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color-scheme: light;
    }

    #gmw-panel[data-theme="dark"] {
      --gmw-bg: #0d1117;
      --gmw-panel-bg: #161b22;
      --gmw-fg: #e6edf3;
      --gmw-muted: #9198a1;
      --gmw-border: #30363d;
      --gmw-link: #58a6ff;
      --gmw-accent: #238636;
      --gmw-input-bg: #0d1117;
      --gmw-warning-bg: #2d2500;
      --gmw-warning-fg: #f0d66b;
      color-scheme: dark;
    }

    #gmw-panel.gmw-open {
      display: flex;
    }

    #gmw-toolbar {
      min-height: 52px;
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      border-bottom: 1px solid var(--gmw-border);
      background: var(--gmw-panel-bg);
    }

    #gmw-toolbar strong {
      font-size: 16px;
      white-space: nowrap;
    }

    #gmw-toolbar .gmw-spacer {
      flex: 1;
    }

    #gmw-toolbar button,
    #gmw-settings button,
    .gmw-heading button {
      padding: 6px 10px;
      border: 1px solid var(--gmw-border);
      border-radius: 6px;
      background: var(--gmw-bg);
      color: var(--gmw-fg);
      font: inherit;
      cursor: pointer;
      white-space: nowrap;
    }

    #gmw-toolbar button:hover,
    #gmw-settings button:hover,
    .gmw-heading button:hover {
      filter: brightness(0.96);
    }

    #gmw-notice {
      flex: 0 0 auto;
      padding: 8px 14px;
      border-bottom: 1px solid var(--gmw-border);
      background: var(--gmw-warning-bg);
      color: var(--gmw-warning-fg);
      font-size: 12px;
    }

    #gmw-notice a {
      color: inherit;
      text-decoration: underline;
    }

    #gmw-columns {
      display: grid;
      grid-template-columns: repeat(4, minmax(300px, 1fr));
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

    .gmw-heading strong {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .gmw-heading a {
      color: var(--gmw-link);
      text-decoration: none;
      white-space: nowrap;
    }

    .gmw-heading a:hover {
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

    #gmw-settings {
      display: none;
      position: absolute;
      inset: 52px 0 0;
      z-index: 2;
      overflow: auto;
      padding: 20px;
      background: var(--gmw-bg);
    }

    #gmw-settings.gmw-visible {
      display: block;
    }

    #gmw-settings h2 {
      margin: 0 0 8px;
      font-size: 20px;
    }

    #gmw-settings p {
      color: var(--gmw-muted);
      max-width: 900px;
    }

    .gmw-setting-row {
      display: grid;
      grid-template-columns: minmax(180px, 240px) minmax(300px, 1fr);
      gap: 12px;
      max-width: 1100px;
      margin: 16px 0;
    }

    .gmw-setting-row label {
      padding-top: 8px;
      font-weight: 600;
    }

    .gmw-setting-row input,
    .gmw-setting-row textarea {
      width: 100%;
      padding: 9px 10px;
      border: 1px solid var(--gmw-border);
      border-radius: 6px;
      background: var(--gmw-input-bg);
      color: var(--gmw-fg);
      font: inherit;
    }

    .gmw-setting-row textarea {
      min-height: 76px;
      resize: vertical;
    }

    #gmw-settings-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 20px;
    }

    #gmw-settings .gmw-primary {
      background: var(--gmw-accent);
      border-color: var(--gmw-accent);
      color: #fff;
    }

    #gmw-settings-status {
      align-self: center;
      color: var(--gmw-muted);
    }

    @media (max-width: 700px) {
      #gmw-toolbar {
        gap: 6px;
        padding: 8px;
      }

      #gmw-toolbar strong {
        font-size: 14px;
      }

      #gmw-toolbar button {
        padding: 5px 7px;
        font-size: 12px;
      }

      #gmw-notice {
        padding: 7px 9px;
      }

      #gmw-columns {
        grid-template-columns: repeat(4, minmax(280px, 85vw));
      }

      .gmw-setting-row {
        grid-template-columns: 1fr;
        gap: 5px;
      }
    }
  `;
  document.head.appendChild(style);

  const launcher = document.createElement('button');
  launcher.id = 'gmw-launcher';
  launcher.type = 'button';
  launcher.textContent = 'My Work';

  const panel = document.createElement('div');
  panel.id = 'gmw-panel';

  const toolbar = document.createElement('div');
  toolbar.id = 'gmw-toolbar';

  const heading = document.createElement('strong');
  heading.textContent = 'GitHub My Work';

  const spacer = document.createElement('span');
  spacer.className = 'gmw-spacer';

  const settingsButton = document.createElement('button');
  settingsButton.type = 'button';
  settingsButton.textContent = 'Settings';

  const refreshButton = document.createElement('button');
  refreshButton.type = 'button';
  refreshButton.textContent = 'Reload all';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.textContent = 'Close';

  toolbar.append(heading, spacer, settingsButton, refreshButton, closeButton);

  const notice = document.createElement('div');
  notice.id = 'gmw-notice';
  notice.append(
    document.createTextNode('If a column is blank, GitHub may be blocking iframe embedding. Configure Header Ext to remove '),
    document.createElement('code')
  );
  notice.lastChild.textContent = 'X-Frame-Options';
  notice.append(document.createTextNode(' and '));
  const cspCode = document.createElement('code');
  cspCode.textContent = 'Content-Security-Policy';
  notice.append(cspCode, document.createTextNode(' response headers for github.com. '));
  const helpLink = document.createElement('a');
  helpLink.href = 'https://github.com/binge6/header-ext';
  helpLink.target = '_blank';
  helpLink.rel = 'noopener noreferrer';
  helpLink.textContent = 'Header Ext help';
  notice.append(helpLink, document.createTextNode('. Removing these protections reduces page security; limit the rules to GitHub and disable them when not needed.'));

  const columns = document.createElement('div');
  columns.id = 'gmw-columns';

  const settings = document.createElement('section');
  settings.id = 'gmw-settings';

  const settingsTitle = document.createElement('h2');
  settingsTitle.textContent = 'Dashboard settings';

  const settingsDescription = document.createElement('p');
  settingsDescription.textContent = 'Edit the titles and GitHub search queries below. Queries are saved in this browser only. Example: is:issue user:@me state:open sort:updated-desc';

  const settingsForm = document.createElement('div');
  const settingsActions = document.createElement('div');
  settingsActions.id = 'gmw-settings-actions';

  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.className = 'gmw-primary';
  saveButton.textContent = 'Save and apply';

  const resetButton = document.createElement('button');
  resetButton.type = 'button';
  resetButton.textContent = 'Restore defaults';

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.textContent = 'Cancel';

  const status = document.createElement('span');
  status.id = 'gmw-settings-status';

  settingsActions.append(saveButton, resetButton, cancelButton, status);
  settings.append(settingsTitle, settingsDescription, settingsForm, settingsActions);

  panel.append(toolbar, notice, columns, settings);
  document.body.append(launcher, panel);

  const settingFields = [];

  function makeSettingField(view, index) {
    const row = document.createElement('div');
    row.className = 'gmw-setting-row';

    const label = document.createElement('label');
    label.htmlFor = `gmw-title-${index}`;
    label.textContent = `Column ${index + 1} title`;

    const inputs = document.createElement('div');

    const titleInput = document.createElement('input');
    titleInput.id = `gmw-title-${index}`;
    titleInput.type = 'text';
    titleInput.maxLength = 60;
    titleInput.value = view.title;
    titleInput.setAttribute('aria-label', `Column ${index + 1} title`);

    const queryLabel = document.createElement('label');
    queryLabel.htmlFor = `gmw-query-${index}`;
    queryLabel.textContent = 'GitHub search query';
    queryLabel.style.display = 'block';
    queryLabel.style.marginTop = '10px';

    const queryInput = document.createElement('textarea');
    queryInput.id = `gmw-query-${index}`;
    queryInput.maxLength = 500;
    queryInput.value = view.query;
    queryInput.setAttribute('aria-label', `Column ${index + 1} GitHub search query`);

    inputs.append(titleInput, queryLabel, queryInput);
    row.append(label, inputs);

    return { row, titleInput, queryInput };
  }

  function buildSettingsForm() {
    settingsForm.replaceChildren();
    settingFields.length = 0;
    views.forEach((view, index) => {
      const field = makeSettingField(view, index);
      settingFields.push(field);
      settingsForm.appendChild(field.row);
    });
  }

  function searchUrl(query) {
    return `/issues?q=${encodeURIComponent(query.trim())}`;
  }

  function renderColumns() {
    columns.replaceChildren();
    frames = [];

    views.forEach((view, index) => {
      const column = document.createElement('section');
      column.className = 'gmw-column';

      const columnHeading = document.createElement('div');
      columnHeading.className = 'gmw-heading';

      const name = document.createElement('strong');
      name.textContent = view.title || `Column ${index + 1}`;

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.alignItems = 'center';
      actions.style.gap = '10px';

      const openLink = document.createElement('a');
      openLink.href = searchUrl(view.query);
      openLink.target = '_blank';
      openLink.rel = 'noopener noreferrer';
      openLink.textContent = 'Open ↗';

      const frame = document.createElement('iframe');
      frame.title = view.title || `Column ${index + 1}`;
      frame.loading = 'lazy';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.src = searchUrl(view.query);
      frames.push(frame);

      actions.appendChild(openLink);
      columnHeading.append(name, actions);
      column.append(columnHeading, frame);
      columns.appendChild(column);
    });
  }

  function refreshAll() {
    frames.forEach(frame => {
      frame.src = frame.src;
    });
  }

  function showSettings() {
    buildSettingsForm();
    status.textContent = '';
    settings.classList.add('gmw-visible');
  }

  function hideSettings() {
    settings.classList.remove('gmw-visible');
  }

  function saveSettings() {
    const updated = settingFields.map((field, index) => ({
      title: field.titleInput.value.trim() || `Column ${index + 1}`,
      query: field.queryInput.value.trim()
    }));

    const emptyQuery = updated.findIndex(view => !view.query);
    if (emptyQuery !== -1) {
      status.textContent = `Column ${emptyQuery + 1} needs a query.`;
      settingFields[emptyQuery].queryInput.focus();
      return;
    }

    views = updated;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
    } catch (error) {
      console.warn('[GitHub My Work] Could not save settings:', error);
      status.textContent = 'Could not save settings in this browser.';
      return;
    }

    renderColumns();
    status.textContent = 'Saved.';
    hideSettings();
  }

  function restoreDefaults() {
    views = DEFAULT_VIEWS.map(view => ({ ...view }));
    buildSettingsForm();
    status.textContent = 'Defaults loaded. Click Save and apply to keep them.';
  }

  function updateTheme() {
    const root = document.documentElement;
    const mode = root.getAttribute('data-color-mode');
    const isDark = mode === 'dark'
      ? true
      : mode === 'light'
        ? false
        : window.matchMedia('(prefers-color-scheme: dark)').matches;

    panel.dataset.theme = isDark ? 'dark' : 'light';
  }

  launcher.addEventListener('click', () => {
    updateTheme();
    panel.classList.add('gmw-open');
    launcher.style.display = 'none';
  });

  closeButton.addEventListener('click', () => {
    panel.classList.remove('gmw-open');
    launcher.style.display = '';
    hideSettings();
  });

  refreshButton.addEventListener('click', refreshAll);
  settingsButton.addEventListener('click', showSettings);
  saveButton.addEventListener('click', saveSettings);
  resetButton.addEventListener('click', restoreDefaults);
  cancelButton.addEventListener('click', hideSettings);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && panel.classList.contains('gmw-open')) {
      if (settings.classList.contains('gmw-visible')) {
        hideSettings();
      } else {
        closeButton.click();
      }
    }
  });

  const themeObserver = new MutationObserver(updateTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-color-mode', 'data-light-theme', 'data-dark-theme']
  });

  const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
  if (colorScheme.addEventListener) {
    colorScheme.addEventListener('change', updateTheme);
  } else if (colorScheme.addListener) {
    colorScheme.addListener(updateTheme);
  }

  buildSettingsForm();
  renderColumns();
  updateTheme();
})();
