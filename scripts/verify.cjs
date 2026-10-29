#!/usr/bin/env node
'use strict';

// Portable checks for the deployable folder. Run from the repository/workspace:
// node work/check_pages_package.cjs outputs/github-pages
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(process.argv[2] || 'outputs/github-pages');
const required = [
  'index.html', '.nojekyll', 'README.md', 'THIRD_PARTY_NOTICES.md',
  'assets/css/dashboard.css', 'assets/js/data.js', 'assets/js/model.js',
  'assets/vendor/gsap.min.js', 'assets/js/dashboard.js'
];
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

try {
  assert.ok(fs.existsSync(root), 'Package folder does not exist: ' + root);
  for (const file of required) {
    assert.ok(fs.existsSync(path.join(root, file)), 'Missing package file: ' + file);
    assert.ok(fs.statSync(path.join(root, file)).isFile(), 'Expected a file: ' + file);
  }

  const html = read('index.html');
  const css = read('assets/css/dashboard.css');
  assert.match(html, /<!doctype\s+html\s*>/i, 'Missing HTML doctype');
  assert.match(html, /<html\b[^>]*\blang=["']vi["']/i, 'Missing Vietnamese language');
  assert.match(html, /<meta\b[^>]*\bcharset=["']?utf-8/i, 'Missing UTF-8 declaration');
  assert.match(html, /<meta\b[^>]*\bname=["']viewport["']/i, 'Missing mobile viewport');

  const attr = (source, name) => {
    const found = source.match(new RegExp('\\b' + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i'));
    return found ? found[1] ?? found[2] ?? found[3] : null;
  };
  const referenced = new Set();
  function localReference(raw, from, label) {
    const value = String(raw).trim();
    if (!value || value.startsWith('#') || /^data:/i.test(value)) return;
    assert.ok(!/^(?:[a-z][a-z\d+.-]*:|\/|\\)/i.test(value), label + ' must be relative: ' + value);
    const clean = decodeURIComponent(value.split(/[?#]/, 1)[0]);
    if (!clean) return;
    const resolved = path.resolve(path.dirname(path.join(root, from)), clean);
    const relative = path.relative(root, resolved);
    assert.ok(relative && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative), label + ' escapes the package: ' + value);
    assert.ok(fs.existsSync(resolved) && fs.statSync(resolved).isFile(), label + ' does not resolve to a file: ' + value);
    referenced.add(relative.split(path.sep).join('/'));
  }

  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
  const expectedScripts = ['assets/js/data.js', 'assets/js/model.js', 'assets/vendor/gsap.min.js', 'assets/js/dashboard.js'];
  assert.equal(scripts.length, expectedScripts.length, 'Expected only four external runtime scripts');
  scripts.forEach((match, i) => {
    const source = attr(match[1], 'src');
    assert.ok(source, 'Inline or missing-source runtime script at position ' + i);
    assert.match(match[1], /(?:^|\s)defer(?:\s|=|$)/i, 'Every script must use defer');
    assert.doesNotMatch(match[1], /(?:^|\s)async(?:\s|=|$)/i, 'async would break runtime order');
    assert.ok(!match[2].trim(), 'External script must not contain inline JavaScript');
    assert.equal(source.replace(/^\.\//, ''), expectedScripts[i], 'Runtime script order changed');
    localReference(source, 'index.html', 'Script');
  });

  for (const match of html.matchAll(/<(link|img|source|video|audio|iframe)\b([^>]*)>/gi)) {
    const tag = match[1].toLowerCase(), attributes = match[2];
    const reference = attr(attributes, tag === 'link' ? 'href' : 'src');
    if (reference) localReference(reference, 'index.html', tag);
    const poster = attr(attributes, 'poster');
    if (poster) localReference(poster, 'index.html', 'Video poster');
  }
  assert.ok(referenced.has('assets/css/dashboard.css'), 'The dashboard stylesheet is not linked');
  for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    localReference(match[1], 'assets/css/dashboard.css', 'CSS resource');
  }
  assert.doesNotMatch(css, /@import\s+["']/i, 'Use local link tags or url() for stylesheets so imports can be verified');

  const allRuntime = [html, css];
  for (const file of expectedScripts) {
    const source = read(file);
    new vm.Script(source, {filename: file});
    allRuntime.push(source);
    if (file !== 'assets/vendor/gsap.min.js') {
      assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(|navigator\s*\.\s*sendBeacon\s*\(/, file + ' unexpectedly needs a network API');
    }
  }
  for (const source of allRuntime) {
    assert.doesNotMatch(source, /__\w+_SCRIPT__/, 'Unexpanded build placeholder');
    assert.doesNotMatch(source, /file:\/\//i, 'A local file URL remains');
    assert.doesNotMatch(source, /(?:^|["'`\s])[A-Za-z]:[\\/]/m, 'An absolute local drive path remains');
    assert.doesNotMatch(source, /(?:^|["'`\s])\/(?:Users|home|workspace|tmp)\//m, 'An absolute local filesystem path remains');
  }

  const vendor = read('assets/vendor/gsap.min.js');
  const vendorHeader = vendor.slice(0, vendor.indexOf('*/') + 2);
  assert.match(vendorHeader, /GSAP\s+3\.14\.2/, 'GSAP version header is missing or different');
  assert.match(vendorHeader, /@license.*Copyright.*GreenSock/i, 'GSAP copyright/license header is missing');
  assert.match(vendorHeader, /gsap\.com\/standard-license/, 'GSAP license reference is missing');
  const notices = read('THIRD_PARTY_NOTICES.md');
  assert.match(notices, /GSAP/i, 'Third-party notices do not mention GSAP');
  assert.match(notices, /3\.14\.2/, 'Third-party notices do not identify the bundled version');

  // Evaluate data and the model without a DOM, browser, or network connection.
  const sandbox = {window: {}, Intl, Date, Set, Map, Number, String};
  vm.createContext(sandbox);
  vm.runInContext(read('assets/js/data.js'), sandbox, {filename: 'data.js', timeout: 1000});
  vm.runInContext(read('assets/js/model.js'), sandbox, {filename: 'model.js', timeout: 1000});
  const data = vm.runInContext('({DATA, GENDER_SOURCE, EXTRA_SOURCE})', sandbox);
  const model = sandbox.window.DB;
  assert.equal(typeof model?.aggregate, 'function', 'The calculation model did not initialize');
  const totals = model.aggregate(data.DATA.rows);
  const expectedTotals = {10: 30205, 30: 405, 41: 130, 61: 12};
  for (const [index, expected] of Object.entries(expectedTotals)) {
    assert.equal(totals.s[index], expected, 'Changed source total at field ' + index);
  }
  assert.equal(totals.s[4], null, 'Incompatible result types must not be pooled');
  const financial = [6,7,8,9,13,14,16,18,19,26,27,28,32,33,34,46,47,48,49,62,63,64,65,66,82];
  for (const row of data.DATA.rows) {
    for (const index of financial) assert.equal(row[index], null, 'Financial field was not removed: ' + index);
  }
  assert.equal(data.GENDER_SOURCE.rows.length, 305, 'Gender source must contain exactly one selected aggregation level');
  const genderImpressions = data.GENDER_SOURCE.rows.reduce((sum, row) => sum + (row.impressions || 0), 0);
  assert.equal(genderImpressions, 30205, 'Gender-source impressions changed');
  assert.equal(data.EXTRA_SOURCE.rows.length, 305, 'Supplemental source changed');
  assert.equal(model.selectRows('2026-08-13', '2026-08-13', 'all').length, 0, 'Missing date must stay missing');
  const zeroRows = model.selectRows('2026-08-16', '2026-08-16', 'all');
  assert.ok(zeroRows.length > 0, 'A real zero date was dropped');
  assert.equal(model.aggregate(zeroRows).s[10], 0, 'A measured zero was changed');
  const older = model.selectRows('2026-08-09', '2026-08-18', '55-64');
  assert.equal(model.aggregate(older).s[10], 1962, 'The age filter changed');
  assert.equal(model.aggregate([]).s[10], null, 'Empty selection must not fabricate zero');

  console.log(JSON.stringify({passed: true, package: root, localAssets: [...referenced], syntaxChecked: expectedScripts.length, gsap: '3.14.2', impressions: totals.s[10], clicks: totals.s[30], linkClicks: totals.s[41], conversations: totals.s[61], genderRows: data.GENDER_SOURCE.rows.length, financialFieldsRemoved: financial.length, filtersAndMissingData: true}, null, 2));
} catch (error) {
  console.error('Package verification failed: ' + error.message);
  process.exitCode = 1;
}
