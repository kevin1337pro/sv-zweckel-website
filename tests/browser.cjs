const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const root = path.resolve(__dirname, "..");
const pages = fs.readdirSync(root).filter((file) => file.endsWith(".html"));
const viewports = [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 600, height: 900 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1100, height: 850 },
  { width: 1101, height: 850 },
  { width: 1440, height: 1000 },
];
const output = path.resolve(
  process.env.SCREENSHOT_DIR || path.join(root, "test-results"),
);
const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

async function startServer() {
  const server = http.createServer((req, res) => {
    const name = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const target = path.resolve(
      root,
      "." + (name === "/" ? "/index.html" : name),
    );
    if (!target.startsWith(root + path.sep) || /\/\./.test(name)) {
      res.writeHead(403).end();
      return;
    }
    fs.readFile(target, (error, content) => {
      if (error) return res.writeHead(404).end("Not found");
      res.setHeader(
        "Content-Type",
        mime[path.extname(target)] || "application/octet-stream",
      );
      res.end(content);
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server;
}

(async () => {
  const server = process.env.BASE_URL ? null : await startServer();
  const base = (
    process.env.BASE_URL || "http://127.0.0.1:" + server.address().port + "/"
  ).replace(/\/?$/, "/");
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_PATH || undefined,
    });
    const errors = [];
    const page = await browser.newPage({
      reducedMotion: "reduce",
      deviceScaleFactor: 1,
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.url().startsWith(base) && response.status() >= 400)
        errors.push(response.status() + " " + response.url());
    });
    fs.mkdirSync(output, { recursive: true });

    async function open(file, viewport) {
      if (viewport) await page.setViewportSize(viewport);
      await page.goto(base + file, { waitUntil: "load" });
      await page.evaluate(() => {
        document.querySelectorAll("img").forEach((img) => {
          img.loading = "eager";
        });
        return document.fonts.ready;
      });
      await page.waitForFunction(() =>
        [...document.images].every(
          (img) => img.complete && img.naturalWidth > 0,
        ),
      );
    }

    for (const viewport of viewports) {
      for (const file of pages) {
        await open(file, viewport);
        const metrics = await page.evaluate(() => {
          const rect = document
            .querySelector(".live-matchbar")
            .getBoundingClientRect();
          const logo = document
            .querySelector(".partner-logo img")
            .getBoundingClientRect();
          return {
            doc: document.documentElement.scrollWidth,
            viewport: document.documentElement.clientWidth,
            bar: {
              left: rect.left,
              right: rect.right,
              height: rect.height,
              bottom: rect.bottom,
            },
            logoHeight: logo.height,
            headings: document.querySelectorAll("h1").length,
            hiddenDetails: document.querySelector("#live-matchbar-extra")
              .hidden,
            fonts:
              document.fonts.check('800 40px "Barlow Condensed"') &&
              document.fonts.check('400 15px "Manrope"'),
          };
        });
        const label = file + " at " + viewport.width;
        assert.ok(
          metrics.doc <= metrics.viewport + 1,
          label + ": horizontal overflow " + JSON.stringify(metrics),
        );
        assert.equal(metrics.headings, 1, label);
        assert.ok(metrics.fonts, label + ": fonts");
        assert.ok(metrics.logoHeight < 100, label + ": oversized sponsor logo");
        assert.ok(
          metrics.bar.left >= 0 && metrics.bar.right <= viewport.width,
          label + ": bar outside viewport",
        );
        assert.ok(
          metrics.bar.bottom <= viewport.height + 1,
          label + ": bar below viewport",
        );
        assert.equal(
          metrics.hiddenDetails,
          viewport.width <= 600,
          label + ": responsive collapsed state",
        );
        if (viewport.width <= 600)
          assert.ok(metrics.bar.height <= 90, label + ": mobile bar too tall");
        const toggle = page.locator(".nav-toggle");
        if (viewport.width <= 1100) {
          await toggle.click();
          assert.equal(
            await toggle.getAttribute("aria-expanded"),
            "true",
            label + ": menu did not open",
          );
          assert.ok(
            await page.locator("#primary-nav").isVisible(),
            label + ": menu hidden",
          );
          await page.keyboard.press("Escape");
          assert.equal(await toggle.getAttribute("aria-expanded"), "false");
          assert.ok(
            await toggle.evaluate((el) => el === document.activeElement),
            label + ": focus not restored",
          );
        } else {
          assert.ok(!(await toggle.isVisible()), label + ": desktop toggle");
          assert.ok(
            await page.locator("#primary-nav").isVisible(),
            label + ": desktop navigation missing",
          );
        }
        if (
          file === "index.html" &&
          [390, 768, 1440].includes(viewport.width)
        ) {
          await page.evaluate(() => document.activeElement?.blur());
          await page.screenshot({
            path: path.join(output, "home-" + viewport.width + ".png"),
            fullPage: true,
          });
          await page.screenshot({
            path: path.join(output, "hero-" + viewport.width + ".png"),
          });
        }
      }
      console.log(
        "PASS layout and navigation: 10 pages at " + viewport.width + "px",
      );
    }

    await open("index.html", { width: 390, height: 844 });
    const barToggle = page.locator(".live-matchbar-toggle");
    const collapsedHeight = (await page.locator(".live-matchbar").boundingBox())
      .height;
    await barToggle.click();
    assert.equal(await barToggle.getAttribute("aria-expanded"), "true");
    assert.ok(await page.locator(".live-matchbar-extra").isVisible());
    assert.ok(
      (await page.locator(".live-matchbar").boundingBox()).height >
        collapsedHeight,
    );
    await page.screenshot({ path: path.join(output, "mobile-expanded.png") });
    await page.keyboard.press("Escape");
    assert.equal(await barToggle.getAttribute("aria-expanded"), "false");
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.locator(".live-matchbar-extra").waitFor({ state: "visible" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(".live-matchbar-extra").waitFor({ state: "hidden" });
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await page.waitForFunction(() => {
      const bottom = document
        .querySelector(".footer-bottom")
        .getBoundingClientRect().bottom;
      return (
        bottom <=
        document.querySelector(".live-matchbar").getBoundingClientRect().top
      );
    });
    console.log("PASS mobile chevron, resize and footer clearance");

    await open("fanshop.html", { width: 390, height: 844 });
    for (const product of ["glory", "vintage", "iconic"]) {
      const card = page.locator('[data-product="' + product + '"]');
      const image = card.locator("img");
      const front = await image.getAttribute("src");
      const button = card.locator("button");
      await button.click();
      await image.evaluate((img) => img.decode());
      assert.notEqual(await image.getAttribute("src"), front);
      assert.equal(await button.getAttribute("aria-pressed"), "true");
      await button.click();
      assert.equal(await image.getAttribute("src"), front);
      assert.equal(await button.getAttribute("aria-pressed"), "false");
    }
    await page.evaluate(() => {
      document.activeElement?.blur();
      window.scrollTo(0, 0);
    });
    await page.waitForFunction(() => window.scrollY === 0);
    await page.screenshot({
      path: path.join(output, "fanshop-mobile.png"),
      fullPage: true,
    });
    console.log("PASS all three front/back product controls");

    await open("news.html", { width: 1440, height: 1000 });
    const youth = page.locator('[data-filter="Jugend"]');
    await youth.click();
    assert.equal(await page.locator(".news-card:visible").count(), 1);
    assert.ok(await youth.evaluate((el) => el === document.activeElement));
    await page.locator("#archive-search").fill("gibt-es-nicht");
    assert.ok(await page.locator("#news-empty").isVisible());
    await page.locator("#reset-news").click();
    assert.equal(await page.locator(".news-card:visible").count(), 3);
    await page.locator("#archive-search").fill("  GRAFENWALD  ");
    assert.equal(await page.locator(".news-card:visible").count(), 1);
    assert.equal(
      await page.locator("#archive-count").textContent(),
      "1 Beitrag",
    );
    console.log("PASS news filters, search, empty state and keyboard focus");

    await open("service.html", { width: 390, height: 844 });
    assert.deepEqual(await page.locator("#topic option").allTextContents(), [
      "Allgemeine Frage",
      "Mitgliedschaft",
      "Probetraining Jugend",
      "Probetraining Senioren",
      "Sponsoring",
      "Ehrenamt",
    ]);
    await page.locator("#contact-form button").click();
    assert.ok(
      await page.locator("#email-fallback").isHidden(),
      "Empty form must not create an email",
    );
    await page.locator("#name").fill("Test & Prüfung");
    await page.locator("#email").fill("test@example.org");
    await page.locator("#topic").selectOption("Sponsoring");
    await page
      .locator("#message")
      .fill("Eine Testnachricht mit & und Umlauten: Grüße.");
    await page.locator("#contact-form button").click();
    const emailHref = await page
      .locator("#email-fallback")
      .getAttribute("href");
    assert.ok(emailHref.startsWith("mailto:info@svzweckel.de?subject="));
    const params = new URLSearchParams(emailHref.split("?")[1]);
    assert.equal(params.get("subject"), "Website-Anfrage: Sponsoring");
    assert.ok(params.get("body").includes("Test & Prüfung"));
    assert.ok(params.get("body").includes("Grüße."));
    assert.match(
      await page.locator("#form-status").textContent(),
      /nichts versendet/,
    );
    console.log("PASS required fields and encoded email draft without sending");

    await open("erste-mannschaft.html", { width: 390, height: 844 });
    await page
      .getByText("Kaderarchiv 2025/26 anzeigen", { exact: true })
      .click();
    assert.equal(await page.locator("#squad-archive li:visible").count(), 15);
    assert.ok(await page.locator("#squad-archive").isVisible());
    await open("index.html", { width: 390, height: 844 });
    assert.equal(
      await page
        .locator(".outline-marquee-track")
        .evaluate((el) => getComputedStyle(el).animationName),
      "none",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.locator("[data-marquee-toggle]").click();
    assert.equal(
      await page
        .locator(".outline-marquee-track")
        .evaluate((el) => getComputedStyle(el).animationPlayState),
      "paused",
    );
    console.log("PASS squad archive and reduced-motion/marquee controls");

    const noJs = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    const fallback = await noJs.newPage();
    await fallback.goto(base, { waitUntil: "load" });
    assert.ok(await fallback.locator("#primary-nav").isVisible());
    assert.ok(await fallback.getByRole("heading", { level: 1 }).isVisible());
    assert.ok(!(await fallback.locator(".live-matchbar").isVisible()));
    await noJs.close();
    assert.deepEqual(errors, [], "Browser or network errors");
    console.log("PASS no-JavaScript navigation and no browser/network errors");
    console.log("Screenshots: " + output);
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
