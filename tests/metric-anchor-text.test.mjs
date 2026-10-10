import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as data from '../src/data/se-tailoring-data.js';
import { ASSESSOR_GUIDANCE } from '../src/data/generated-assessor-guidance.js';
import { getMetricAnchorText } from '../src/utils/metric-anchor-text.js';
import { generateReport } from '../src/utils/export-import.js';
import { escapeHtml } from '../src/utils/safe-text.js';

const fixtureForScore = score => ({
  assessmentComplete: true,
  projectInfo: { boundary: 'Booking service <only> & interfaces', purpose: 'Plan "integration" work' },
  scores: Object.fromEntries(data.METRICS.map(metric => [metric.id, score])),
  metricAssessments: Object.fromEntries(data.METRICS.map(metric => [metric.id, {
    score, status: 'assessed', definitionVersion: 3, qualifiers: [], rationale: '', evidenceRefs: []
  }])),
  levels: Object.fromEntries(data.CORE_PROCESSES.map(process => [process.id, 'comprehensive'])),
  csiResponse: {
    responseType: score === 5 ? 'sponsor-escalation' : 'feasibility-review',
    selectedActions: ['add-capacity'], protectedOutputs: 'Preserve required evidence',
    rationaleDecision: 'Synthetic test case', ownerApprover: 'Test role',
    evidenceRef: 'TEST-01', reviewDate: '2026-10-10'
  }
});

test('all 80 selected-rating descriptions match the assessment radio anchors', () => {
  assert.equal(data.METRICS.length, 16);
  for (const metric of data.METRICS) {
    for (const score of [1, 2, 3, 4, 5]) {
      const expected = ASSESSOR_GUIDANCE[metric.id].anchors[score];
      assert.ok(expected, `${metric.id} anchor ${score} exists`);
      assert.equal(getMetricAnchorText(metric, score), expected);
      assert.equal(getMetricAnchorText(metric.id, String(score)), expected);
    }
  }
});

test('selected-rating text never invents an anchor for missing or invalid ratings', () => {
  for (const score of [undefined, null, '', 0, 6, 2.5, NaN, 'unknown', true, false]) {
    assert.equal(getMetricAnchorText('M1', score), '');
  }
  assert.equal(getMetricAnchorText('missing', 2), '');
  assert.equal(getMetricAnchorText({ id: 'extension', anchors: { 2: 'Explicit extension anchor' } }, 2), 'Explicit extension anchor');
  assert.equal(getMetricAnchorText({ id: 'M1', anchors: { 2: 'Outdated description' } }, 2), ASSESSOR_GUIDANCE.M1.anchors[2]);
});

test('HTML export includes exact selected descriptions for all 16 metrics at all five scores', () => {
  const originalDocument = globalThis.document;
  let downloadCount = 0;
  globalThis.document = { createElement: () => ({ click() { downloadCount += 1; } }) };
  try {
    for (const score of [1, 2, 3, 4, 5]) {
      const html = generateReport(fixtureForScore(score), data);
      const metricTable = html.split('<h2>Metric Scores</h2>')[1].split('</table>')[0];
      for (const metric of data.METRICS) {
        assert.ok(metricTable.includes(`<td>${score}<br><small>Confirmed</small></td><td>${escapeHtml(ASSESSOR_GUIDANCE[metric.id].anchors[score])}</td>`), `${metric.id} exported anchor ${score}`);
      }
      assert.equal((html.match(/data-process-id=/g) || []).length, 22);
      assert.equal((html.match(/data-metric-id=/g) || []).length, 16);
      assert.ok(html.indexOf('<h2>Process Tailoring Levels</h2>') < html.indexOf('<h2>Metric Scores</h2>'));
      assert.ok(!html.includes('ordinal-anchor'));
      const expectedOccurrences = new Map();
      for (const metric of data.METRICS) {
        const description = escapeHtml(ASSESSOR_GUIDANCE[metric.id].anchors[score]);
        expectedOccurrences.set(description, (expectedOccurrences.get(description) || 0) + 1);
      }
      for (const [description, count] of expectedOccurrences) {
        assert.equal(html.split(`<td>${description}</td>`).length - 1, count, 'selected anchor appears once per metric');
      }
      assert.match(html, /Do not add or average ratings/);
      assert.match(html, /Higher M16 means stronger enabling conditions/);
      assert.match(html, /se-tailoring-m1-m16-v3/);
      assert.match(html, /External approval not verified/);
      assert.match(html, /Context and software checks/);
      assert.ok(html.includes('<strong>Assessed boundary</strong>: Booking service &lt;only&gt; &amp; interfaces'));
      assert.ok(html.includes('<strong>Decision purpose</strong>: Plan &quot;integration&quot; work'));
      assert.ok(!html.includes('<only>'));
    }
    assert.equal(downloadCount, 5);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});

test('Help preserves rule thresholds and makes the operating and evidence boundaries explicit', () => {
  const help = readFileSync(new URL('../src/views/help.js', import.meta.url), 'utf8');
  assert.match(help, /Basic does not mean skipping the process/);
  assert.match(help, /different Primary at 3 or above/);
  assert.match(help, /Primary at 5 plus a Secondary at 5/);
  assert.match(help, /Select Cannot assess yet/);
  assert.match(help, /Prototype use only/);
  assert.match(help, /does not support consequential self-service use/);
  assert.match(help, /does not check whether all project evidence is present/);
  assert.match(help, /Changing these fields alone does not filter processes/);
  assert.match(help, /high M15 rating alone does not activate these conditional mappings/);
  assert.match(help, /Pilot HTML retains free text and evidence references and is not de-identified/);
  assert.match(help, /observed outcome separately from your opinion/);
  assert.doesNotMatch(help, /Send proposals through the peer-review form/);
  const chain = data.DEPENDENCY_CHAINS.find(item => item.id === 'req_design');
  assert.match(chain.description, /does not impose a maximum level gap/);
  assert.doesNotMatch(chain.description, /Avoid rigor gaps greater than one level/);
});


test('HTML distinguishes missing derivation provenance from explicitly recorded Basic and supported evidence', () => {
  const originalDocument = globalThis.document;
  globalThis.document = { createElement: () => ({ click() {} }) };
  try {
    const state = fixtureForScore(3);
    state.derived = { 9: 'basic' };
    state.confidence = { 9: 'high' };
    state.metricAssessments.M1.status = 'inherited-confirmed';
    const html = generateReport(state, data);
    const p9 = html.split('<tr data-process-id="9">')[1].split('</tr>')[0];
    const p10 = html.split('<tr data-process-id="10">')[1].split('</tr>')[0];
    assert.match(p9, /data-label="Derived"><span class="badge basic">basic/);
    assert.match(p9, /Supported by drivers\/rules/);
    assert.match(p10, /data-label="Derived">Not recorded<\/td>/);
    assert.match(p10, /data-label="Evidence status">Not recorded<\/td>/);
    assert.ok(!p10.includes('⬆️'));
    assert.match(html, /Inherited, confirmed/);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});
