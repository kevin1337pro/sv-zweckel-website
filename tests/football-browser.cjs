const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const root = path.resolve(__dirname, "..");
const output = path.resolve(
  process.env.SCREENSHOT_DIR || path.join(root, "test-results"),
);
const host = "[data-football]";
const stage = "[data-football-viewport]";
let server;

async function localURL() {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/?$/, "/");
  server = spawn(process.execPath, ["scripts/serve.mjs"], {
    cwd: root,
    env: { ...process.env, PORT: "0" },
    stdio: ["ignore", "pipe", "inherit"],
  });
  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.on("exit", (code) => {
      if (code) reject(new Error("Preview server failed: " + code));
    });
    server.stdout.on("data", (chunk) => {
      const url = String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
      if (url) resolve(url + "/");
    });
  });
}

(async () => {
  const base = await localURL();
  let browser;
  const errors = [];
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ["--enable-unsafe-swiftshader"],
    });
    fs.mkdirSync(output, { recursive: true });
    async function pageWith(options = {}, setup) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        reducedMotion: "reduce",
        ...options,
      });
      await context.addInitScript(() => {
        window.__footballDrawCalls = 0;
        if (window.WebGL2RenderingContext) {
          for (const name of ["drawElements", "drawArrays"]) {
            const original = WebGL2RenderingContext.prototype[name];
            WebGL2RenderingContext.prototype[name] = function (...args) {
              window.__footballDrawCalls++;
              return original.apply(this, args);
            };
          }
        }
      });
      if (setup) await context.addInitScript(setup);
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      return page;
    }
    async function open(page, state = "ready") {
      await page.goto(base + "index.html", { waitUntil: "networkidle" });
      await page.waitForFunction(
        ({ host, state }) =>
          document.querySelector(host)?.dataset.state === state,
        { host, state },
      );
      await page.evaluate(() => document.fonts.ready);
    }
    async function close(page) {
      await page.context().close();
    }
    const draws = (page) => page.evaluate(() => window.__footballDrawCalls);
    async function stable(page, label) {
      await page.waitForTimeout(200);
      const before = await draws(page);
      await page.waitForTimeout(300);
      assert.equal(await draws(page), before, label);
    }

    for (const width of [320, 390, 600, 768, 1024, 1440]) {
      const page = await pageWith({
        viewport: { width, height: width < 600 ? 844 : 1000 },
      });
      await open(page);
      assert.ok((await draws(page)) > 30, "real WebGL draws at " + width);
      assert.equal(
        await page.locator(host).getAttribute("data-motion"),
        "paused",
      );
      const metrics = await page.evaluate(() => {
        const stage = document
          .querySelector("[data-football-viewport]")
          .getBoundingClientRect();
        const canvas = document.querySelector(
          "[data-football-viewport] canvas",
        );
        return {
          width: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          stage: { left: stage.left, right: stage.right, height: stage.height },
          pixels: canvas.width * canvas.height,
          poster: getComputedStyle(document.querySelector(".football-poster"))
            .opacity,
        };
      });
      assert.ok(metrics.scrollWidth <= width + 1, "page overflow at " + width);
      assert.ok(
        metrics.stage.left >= 0 && metrics.stage.right <= width,
        "stage overflow at " + width,
      );
      assert.ok(metrics.stage.height >= 200 && metrics.stage.height <= 470);
      assert.ok(metrics.pixels > 30000, "canvas has render resolution");
      assert.equal(metrics.poster, "0", "model, not poster, is shown");
      if ([390, 768, 1440].includes(width)) {
        await page.screenshot({
          path: path.join(output, "3d-home-" + width + ".png"),
        });
        await page
          .locator(stage)
          .screenshot({ path: path.join(output, "3d-ball-" + width + ".png") });
      }
      await stable(page, "reduced motion does not keep rendering");
      await close(page);
    }
    console.log(
      "PASS real WebGL, bounded canvas, layouts and reduced motion at six widths",
    );

    const page = await pageWith();
    await open(page);
    const next = page.locator("[data-football-next]");
    const links = [
      "news.html",
      "jugend.html",
      "fanshop.html",
      "mitgliedschaft.html",
      "service.html",
      "mannschaften.html",
    ];
    for (let i = 0; i < links.length; i++) {
      await next.focus();
      await page.keyboard.press("Enter");
      assert.equal(
        await page.locator(host).getAttribute("data-area"),
        String((i + 1) % 6),
      );
      assert.equal(
        await page.locator("[data-football-link]").getAttribute("href"),
        links[i],
      );
      assert.ok(
        (await page.locator("[data-football-status]").textContent()).length >
          10,
      );
    }
    await page.locator("[data-football-previous]").click();
    assert.equal(await page.locator(host).getAttribute("data-area"), "5");
    await page.locator("[data-football-link]").click();
    await page.waitForURL("**/service.html");
    assert.ok(await page.locator("h1").isVisible());
    console.log(
      "PASS all six destinations, keyboard, wrapping and real page navigation",
    );

    await open(page);
    const { footballTopology, initialOrientation, BALL_RADIUS } =
      await import("../src/football/geometry.mjs");
    const { PerspectiveCamera } = await import("three");
    const faces = footballTopology();
    const rotation = initialOrientation(faces);
    const front = faces
      .filter((face) => face.kind === "pentagon" && face.index % 6 !== 0)
      .sort(
        (a, b) =>
          b.normal.clone().applyQuaternion(rotation).z -
          a.normal.clone().applyQuaternion(rotation).z,
      )[0];
    let box = await page.locator(stage).boundingBox();
    const camera = new PerspectiveCamera(34, box.width / box.height, 0.1, 30);
    camera.position.set(0, 0.08, 6.7);
    camera.updateMatrixWorld();
    const point = front.normal
      .clone()
      .multiplyScalar(BALL_RADIUS)
      .applyQuaternion(rotation)
      .project(camera);
    await page.mouse.click(
      box.x + ((point.x + 1) / 2) * box.width,
      box.y + ((1 - point.y) / 2) * box.height,
    );
    assert.equal(
      await page.locator(host).getAttribute("data-area"),
      String(front.index % 6),
      "actual black panel hit",
    );
    const beforeDrag = await page.locator(stage).screenshot();
    const areaBeforeDrag = await page.locator(host).getAttribute("data-area");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width / 2 + 95,
      box.y + box.height / 2 + 25,
      { steps: 10 },
    );
    await page.mouse.up();
    await page.mouse.move(0, 0);
    assert.notDeepEqual(
      await page.locator(stage).screenshot(),
      beforeDrag,
      "drag rotates visible geometry",
    );
    assert.equal(
      await page.locator(host).getAttribute("data-area"),
      areaBeforeDrag,
      "drag is not a panel click",
    );

    const motion = page.locator("[data-football-motion]");
    await motion.click();
    await page.mouse.move(0, 0);
    let before = await draws(page);
    await page.waitForTimeout(300);
    assert.ok(
      (await draws(page)) > before,
      "explicit play works even with reduced motion",
    );
    await motion.click();
    await stable(page, "pause stops the rendering loop");
    await motion.click();
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
    );
    await stable(page, "offscreen canvas is idle");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(100);
    before = await draws(page);
    await page.waitForTimeout(250);
    assert.ok((await draws(page)) > before, "on-screen canvas resumes");
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await stable(page, "hidden document is idle");
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    before = await draws(page);
    await page.waitForTimeout(250);
    assert.ok((await draws(page)) > before, "visible document resumes");
    await close(page);
    console.log(
      "PASS raycast selection, mouse dragging, pause, visibility and render-loop suspension",
    );

    const mobile = await pageWith({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    await open(mobile);
    const cdp = await mobile.context().newCDPSession(mobile);
    box = await mobile.locator(stage).boundingBox();
    const x = box.x + box.width * 0.35,
      y = box.y + box.height * 0.6;
    const beforeTouch = await mobile.locator(stage).screenshot();
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    for (let i = 1; i <= 8; i++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x + i * 12, y }],
      });
      await mobile.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    assert.notDeepEqual(
      await mobile.locator(stage).screenshot(),
      beforeTouch,
      "touch rotates ball",
    );
    const initialScroll = await mobile.evaluate(() => window.scrollY);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    for (let i = 1; i <= 8; i++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y - i * 18 }],
      });
      await mobile.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await mobile.waitForFunction(
      (start) => window.scrollY > start + 60,
      initialScroll,
    );
    await close(mobile);
    console.log(
      "PASS real touch dragging and native vertical scrolling over the ball",
    );

    const saved = await pageWith({}, () =>
      Object.defineProperty(navigator, "connection", {
        configurable: true,
        value: { saveData: true },
      }),
    );
    const requests = [];
    saved.on("request", (request) => requests.push(request.url()));
    await open(saved, "poster");
    assert.ok(
      !requests.some((url) => /\/scene-[^/]+\.js/.test(url)),
      "data saving does not fetch Three.js",
    );
    await saved.locator("[data-football-start]").click();
    await saved.waitForFunction(
      () => document.querySelector("[data-football]").dataset.state === "ready",
    );
    assert.ok((await draws(saved)) > 30);
    assert.ok(
      await saved
        .locator("[data-football-motion]")
        .evaluate((el) => el === document.activeElement),
    );
    await close(saved);

    const noGL = await pageWith({}, () => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return type === "webgl2" ? null : original.call(this, type, ...args);
      };
    });
    await open(noGL, "fallback");
    assert.equal(
      await noGL
        .locator(".football-poster")
        .evaluate((el) => getComputedStyle(el).opacity),
      "1",
    );
    assert.ok(!(await noGL.locator("[data-football-controls]").isVisible()));
    await noGL.locator("[data-football-link]").click();
    await noGL.waitForURL("**/mannschaften.html");
    await close(noGL);

    const lost = await pageWith();
    await open(lost);
    await lost.evaluate(() =>
      document
        .querySelector("[data-football-viewport] canvas")
        .getContext("webgl2")
        .getExtension("WEBGL_lose_context")
        .loseContext(),
    );
    await lost.waitForFunction(
      () =>
        document.querySelector("[data-football]").dataset.state === "fallback",
    );
    assert.ok(!(await lost.locator("[data-football-controls]").isVisible()));
    await stable(lost, "lost context stops rendering");
    await close(lost);

    const noJS = await pageWith({ javaScriptEnabled: false });
    await noJS.goto(base, { waitUntil: "networkidle" });
    assert.ok(await noJS.locator(".football-poster").isVisible());
    assert.ok(!(await noJS.locator("[data-football-controls]").isVisible()));
    assert.ok(await noJS.locator("[data-football-link]").isVisible());
    await noJS.screenshot({ path: path.join(output, "3d-no-javascript.png") });
    await close(noJS);
    console.log(
      "PASS data saving, WebGL fallback, context loss and no-JavaScript navigation",
    );
    assert.deepEqual(errors, [], "browser errors");
    console.log("PASS no browser errors; screenshots: " + output);
  } finally {
    await browser?.close();
    server?.kill();
  }
})().catch((error) => {
  console.error(error);
  server?.kill();
  process.exitCode = 1;
});
