## Features

A "My Work" button appears in the bottom-right corner of GitHub. Clicking it opens a configurable multi-column dashboard: each column is an iframe showing one GitHub page. The four default columns are your issues, issues you are involved in, your pull requests, and pull requests you are involved in.

- Each column can be a search query or any `github.com` page URL, with 1–8 columns that can be added or removed
- Search columns trim the embedded page down to the issue / PR list area, hiding GitHub's duplicated header, sidebar and footer
- The panel follows GitHub's light / dark theme, and the embedded pages follow it too
- Bilingual UI (Chinese / English), detected automatically or fixed in settings
- Settings are stored locally in `localStorage`; no GitHub token is needed

## ⚠️ Header Ext is required

Every column is a real GitHub page, and GitHub forbids embedding it in an iframe through `X-Frame-Options` and `Content-Security-Policy`. A userscript cannot bypass that from inside the page — the headers have to be removed at the browser level:

1. Install [Header Ext](https://github.com/binge6/header-ext)
2. Add a rule that removes `X-Frame-Options` and `Content-Security-Policy` from responses for `github.com`

Without it the panel and settings still work, but every column stays blank (that is expected, and the notice at the top of the panel says so).

Removing those headers weakens GitHub's browser-side protections. Keep the rule limited to `github.com` and turn it off when you no longer need it.

## Usage

- Open the panel with "My Work" in the bottom-right corner; close it with the `×` icon button at the top right, or press `Esc`
- In "Settings" you can rename each column, switch it between "Search query" and "Page URL", add or remove columns, and change the UI language
- In settings, "Save and apply", "Restore defaults" and "Cancel" appear in the top toolbar
- "Open ↗" on each column opens that page in a new tab; "Reload all" refreshes every column
- The `?` icon brings back a dismissed notice

## Default columns

| Column | Query |
| --- | --- |
| My issues | `is:issue user:@me state:open sort:updated-desc` |
| Issues I'm involved in | `is:issue involves:@me state:open sort:updated-desc` |
| My pull requests | `is:pr user:@me state:open sort:updated-desc` |
| Pull requests I'm involved in | `is:pr involves:@me state:open archived:false sort:updated-desc` |

## Permissions and privacy

- `@grant none`: no GM APIs, no cookie access, no GitHub token
- The only external request is the icon component (iconify-icon) from jsdelivr; if it fails, the script falls back to built-in icons
- Settings live in `localStorage` under `github-my-work.settings.v2`; the 1.0 format is migrated automatically

## Changelog

### 1.1.1

- Added localized metadata (Chinese name and description) plus homepage and support URLs

### 1.1.0

- Each column can be a search query or a page URL; 1–8 columns, add or remove
- Search columns trim the iframe to the list area and follow the light / dark theme
- The notice can be dismissed; the `?` icon brings it back
- The close button is now a global icon button; settings actions moved to the top toolbar
- Column cards use a two-row layout and a responsive grid
- Bilingual UI; settings upgraded to v2 with v1 migration
- Icons use the iconify web component with a built-in fallback

### 1.0.0

- Initial release: a configurable four-column issues / pull requests dashboard with theme sync, horizontal scrolling on narrow screens, and persisted settings

## Source

https://github.com/shijianjs/userscripts/tree/main/userscripts/github-my-work
