import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = readdirSync(root).filter((name) => name.endsWith(".html"));
const read = (name) => readFileSync(path.join(root, name), "utf8");
const context = { window: {} };
vm.runInNewContext(read("data.js"), context);
const data = context.window.svzData;

test("every page uses the shared navigation, styles and scripts", () => {
  assert.equal(pages.length, 10);
  for (const file of pages) {
    const html = read(file);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, file + ": one h1");
    assert.match(html, /<html lang="de">/);
    assert.match(html, /href="styles\.css\?v=/);
    assert.match(html, /src="data\.js\?v=.*?defer/);
    assert.match(html, /src="script\.js\?v=.*?defer/);
    assert.match(html, /href="#main"/);
    assert.match(html, /id="main"/);
    assert.match(html, /id="primary-nav"/);
    assert.doesNotMatch(
      html,
      /__TITLE__|__CURRENT_|__CONTENT__|hero-overlay-card/,
    );
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, file + ": duplicate ids");
  }
});

test("all local links, assets and fragments resolve", () => {
  for (const file of pages) {
    const html = read(file);
    for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
      const url = match[1].replaceAll("&amp;", "&");
      if (/^(https?:|mailto:|tel:|data:)/i.test(url)) continue;
      const [resource, fragment] = url.split("#");
      const name = decodeURIComponent(resource.split("?")[0] || file);
      assert.ok(existsSync(path.join(root, name)), file + ": missing " + name);
      if (fragment && name.endsWith(".html")) {
        assert.ok(
          read(name).includes('id="' + fragment + '"'),
          file + ": missing fragment " + url,
        );
      }
    }
    for (const match of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
      assert.match(match[0], /rel="[^"]*\bnoopener\b[^"]*"/);
    }
  }
  for (const item of data.news)
    assert.ok(existsSync(path.join(root, item.image)));
  for (const item of data.products) {
    assert.ok(existsSync(path.join(root, item.front)), item.front);
    assert.ok(existsSync(path.join(root, item.back)), item.back);
  }
  for (const match of read("styles.css").matchAll(/url\("([^"]+)"\)/g)) {
    assert.ok(existsSync(path.join(root, match[1])), match[1]);
  }
});

test("editorial data has original sources and no simulated live result", () => {
  assert.equal(data.news.length, 3);
  assert.equal(
    new Set(data.news.map((item) => item.slug)).size,
    data.news.length,
  );
  for (const item of data.news) {
    assert.match(item.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(item.sourceUrl, /^https:\/\/www\.svzweckel\.de\/\?p=\d+$/);
  }
  assert.equal(data.match.status, "Endstand");
  assert.equal(data.match.date, "27.09.2026");
  assert.equal(data.match.score, "4:1");
  assert.equal(data.products.length, 3);
  assert.match(read("script.js"), /kein Live-Feed/);
  assert.doesNotMatch(read("script.js"), /localStorage|setInterval|setTimeout/);
});

test("production workflow publishes a limited public directory", () => {
  const workflow = read(".github/workflows/deploy-pages.yml");
  assert.match(workflow, /path: _site/);
  assert.match(workflow, /npm test/);
});
