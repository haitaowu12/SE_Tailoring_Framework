/**
 * Static security/accessibility guardrails for rendered UI templates.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import { escapeHtml, safeText } from '../src/utils/safe-text.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(__dirname, '..', 'src');
const appRoot = join(__dirname, '..');

function listJavaScriptFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...listJavaScriptFiles(path));
    } else if (path.endsWith('.js')) {
      files.push(path);
    }
  }

  return files;
}

test('escapeHtml neutralizes markup, attributes, and quoted text', () => {
  const dangerous = `"><img src=x onerror="alert('x')">&`;
  assert.equal(
    escapeHtml(dangerous),
    '&quot;&gt;&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;'
  );
  assert.equal(safeText('   ', 'fallback'), 'fallback');
});

test('app shell enforces a local-resource CSP and does not contact third-party font hosts', () => {
  const html = readFileSync(join(appRoot, 'index.html'), 'utf8');
  assert.match(html, /http-equiv="Content-Security-Policy"/);
  assert.match(html, /default-src 'self'/);
  assert.match(html, /object-src 'none'/);
  assert.match(html, /referrer" content="no-referrer"/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
});



test('app shell provides a skip link and a focusable main destination', () => {
  const html = readFileSync(join(appRoot, 'index.html'), 'utf8');
  const styles = readFileSync(join(srcRoot, 'styles', 'index.css'), 'utf8');
  assert.match(html, /class="skip-link" href="#main-content"/);
  assert.match(html, /<main id="main-content" tabindex="-1"><\/main>/);
  assert.match(styles, /\.skip-link:focus \{ transform: translateY\(0\); \}/);
});

test('primary navigation uses disclosure semantics rather than application-menu roles', () => {
  const main = readFileSync(join(srcRoot, 'main.js'), 'utf8');
  assert.doesNotMatch(main, /role="menu"|role="menuitem"|aria-haspopup="true"/);
  assert.match(main, /aria-expanded="false">Framework reference/);
  assert.match(main, />Go to section<\/label>/);
  assert.match(main, /aria-label="Go to section"/);
});

test('route changes move focus to the rendered heading and status messages name their urgency', () => {
  const router = readFileSync(join(srcRoot, 'router.js'), 'utf8');
  const state = readFileSync(join(srcRoot, 'state.js'), 'utf8');
  assert.match(router, /function focusRouteHeading/);
  assert.match(router, /target\.focus\(\{ preventScroll: true \}\)/);
  assert.match(state, /type === 'error' \? 'alert' : 'status'/);
  assert.match(state, /aria-atomic', 'true'/);
});

test('dark-theme support text and error text use raised contrast tokens', () => {
  const styles = readFileSync(join(srcRoot, 'styles', 'index.css'), 'utf8');
  assert.match(styles, /--text-tertiary: oklch\(68% 0\.01 250\)/);
  assert.match(styles, /--accent-error: oklch\(72% 0\.18 25\)/);
});

test('current practitioner copy does not authorize private or undefined informal substitutes', () => {
  const details = readFileSync(join(srcRoot, 'data', 'process-details.js'), 'utf8');
  const processes = readFileSync(join(srcRoot, 'data', 'processes.js'), 'utf8');
  assert.doesNotMatch(details, /Monitor via informal methods|Conduct audits \(informal\)/);
  assert.doesNotMatch(processes, /non-conformances tracked informally/);
  assert.match(details, /authorized team or project record/);
  assert.match(details, /applicable risk, hazard, safety, ethics, regulatory, issue, or nonconformance channel/);
});

test('source templates avoid inline event handlers and javascript pseudo-links', () => {
  const offenders = [];
  const inlineEventPattern = /(?<!\.)\bon(?:click|error|load|mouseover|mouseenter|mouseleave)\s*=/i;
  const javascriptLinkPattern = /href\s*=\s*["']javascript:/i;

  for (const file of listJavaScriptFiles(srcRoot)) {
    const text = readFileSync(file, 'utf8');
    if (inlineEventPattern.test(text)) {
      offenders.push(`${relative(srcRoot, file)}: inline event attribute`);
    }
    if (javascriptLinkPattern.test(text)) {
      offenders.push(`${relative(srcRoot, file)}: javascript pseudo-link`);
    }
  }

  assert.deepEqual(offenders, []);
});

test('assessment form controls expose explicit accessible names and button semantics', () => {
  const text = readFileSync(join(srcRoot, 'views', 'assessment.js'), 'utf8');

  for (const id of ['proj-name', 'proj-date', 'proj-team', 'proj-phase']) {
    assert.match(text, new RegExp(`<label[^>]+for="${id}"`), `${id} must have an associated label`);
  }

  assert.match(text, /<button class="step-dot[^"]*"/, 'step navigation controls should be real buttons');
  assert.doesNotMatch(text, /<div class="step-dot/, 'step navigation should not use clickable divs');
  assert.match(text, /type="radio" class="metric-anchor-radio"/, 'metrics should expose discrete ordinal radio choices');
  assert.match(text, /aria-label="\$\{escapeHtml\(m\.id\)\} score \$\{score\}:/, 'metric anchor radios need explicit accessible names');
  assert.match(text, /aria-describedby="guide-\$\{m\.id\} desc-\$\{m\.id\}"/, 'metric anchor groups should reference guidance and current state');
});

test('vee lifecycle view provides non-visual table fallback', () => {
  const text = readFileSync(join(srcRoot, 'views', 'vee-model.js'), 'utf8');

  assert.match(text, /<table[^>]+class="[^"]*vee-fallback-table/, 'Vee view should render a table fallback');
  assert.match(text, /<caption>Vee lifecycle process table<\/caption>/, 'fallback table should identify its purpose');
  assert.match(text, /Open \$\{escapeHtml\(processName\(n\.processId\)\)\}/, 'fallback rows should expose process navigation actions');
});

test('pilot report stays visibly bounded and exposes a print-review stylesheet', () => {
  const report = readFileSync(join(srcRoot, 'views', 'report.js'), 'utf8');
  const styles = readFileSync(join(srcRoot, 'styles', 'index.css'), 'utf8');

  assert.match(report, /Pilot record — not an authoritative organizational baseline/);
  assert.match(report, /content:'PILOT \/ WIP'/);
  assert.match(styles, /@media print/);
  assert.match(styles, /details\.report-section:not\(\[open\]\) > :not\(summary\)/, 'print review should expose collapsed report sections');
  assert.match(styles, /details\.report-section::details-content/, 'Chromium print review should expose the native details content wrapper');
  assert.match(report, /addEventListener\('beforeprint', beforePrint\)/, 'print review should explicitly expand report disclosures before printing');
  assert.match(report, /addEventListener\('afterprint', afterPrint\)/, 'print review should restore disclosure state after printing');
  assert.match(styles, /\.data-table thead \{ display: table-header-group; \}/, 'long printed tables should repeat headings');
});

test('README verification wording distinguishes automated checks from manual browser smoke', () => {
  const text = readFileSync(join(appRoot, 'README.md'), 'utf8');

  assert.match(text, /Manual browser smoke:/, 'README should label browser smoke as manual evidence unless automated e2e exists');
  assert.match(text, /Manual mobile viewport smoke \(390px\):/, 'README should record mobile-width rendered smoke as manual evidence unless automated e2e exists');
  assert.doesNotMatch(text, /Mobile Playwright smoke/, 'README should not imply mobile smoke is automated without a Playwright test script');
  assert.doesNotMatch(text, /Browser smoke:/, 'README should not imply browser smoke is an automated verification gate');
  assert.doesNotMatch(text, /expert-reviewed and case-demonstrated decision aid/, 'README should not overstate validation evidence');
  assert.doesNotMatch(text, /opens as an assessed 1–5 score at the neutral midpoint/, 'README must distinguish midpoint previews from assessed judgments');
  assert.match(text, /opens with a non-authoritative midpoint preview/);
});

test('stakeholder-facing copy does not present evidence status as calibrated confidence', () => {
  const checkedFiles = [
    join(srcRoot, 'views', 'assessment.js'),
    join(srcRoot, 'views', 'report.js'),
    join(srcRoot, 'utils', 'export-import.js'),
    join(srcRoot, 'styles', 'index.css')
  ];

  for (const file of checkedFiles) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /high confidence/i, `${relative(appRoot, file)} should not display high-confidence wording`);
    assert.doesNotMatch(text, /confidence badges/i, `${relative(appRoot, file)} should label UI badges as evidence status`);
  }
});
