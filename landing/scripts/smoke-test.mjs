import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:5173";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function isReachable(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

class CdpClient {
  constructor(wsUrl) {
    this.nextId = 0;
    this.pending = new Map();
    this.ws = new WebSocket(wsUrl);
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message);
      }
    });
  }

  async open() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
  }

  send(method, params = {}) {
    const id = ++this.nextId;
    const promise = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => reject(new Error(`CDP timeout for ${method}`)), 12000);
    });
    this.ws.send(JSON.stringify({ id, method, params }));
    return promise;
  }

  close() { if (this.ws.readyState === WebSocket.OPEN) this.ws.close(); }
}

async function findCdpPort(startPort = 9227) {
  let port = startPort;
  while (await isReachable(`http://127.0.0.1:${port}/json/version`)) port += 1;
  return port;
}

async function waitForDevtools(port) {
  for (let index = 0; index < 80; index += 1) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const tab = tabs.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
      if (tab) return tab.webSocketDebuggerUrl;
    } catch { /* Chrome is still starting. */ }
    await delay(250);
  }
  throw new Error("Chrome DevTools endpoint did not become ready");
}

async function run() {
  let devServer;
  if (!(await isReachable(baseUrl))) {
    devServer = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev", "--", "--host", "127.0.0.1"], { stdio: "ignore", windowsHide: true });
    for (let i = 0; i < 75 && !(await isReachable(baseUrl)); i += 1) await delay(400);
  }

  const cdpPort = await findCdpPort();
  const userDataDir = await mkdtemp(path.join(os.tmpdir(), "routeship-cdp-"));
  const chrome = spawn(process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", [
    "--headless=new", "--disable-gpu", "--no-first-run", `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${userDataDir}`, "about:blank",
  ], { stdio: "ignore", windowsHide: true });
  let cdp;

  try {
    cdp = new CdpClient(await waitForDevtools(cdpPort));
    await cdp.open();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    const evaluate = async (expression, awaitPromise = false) => {
      const response = await cdp.send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
      if (response.result.exceptionDetails) throw new Error(response.result.exceptionDetails.text || "Browser evaluation failed");
      return response.result.result.value;
    };
    const navigate = async (pathname) => {
      await cdp.send("Page.navigate", { url: `${baseUrl}${pathname}` });
      for (let i = 0; i < 80 && (await evaluate("document.readyState")) !== "complete"; i += 1) await delay(200);
      await delay(350);
      return evaluate("document.body.innerText");
    };

    await cdp.send("Page.navigate", { url: baseUrl });
    for (let i = 0; i < 80 && (await evaluate("document.readyState")) !== "complete"; i += 1) await delay(250);
    await delay(1000);

    const requiredCopy = [
      "Every order.", "THE PROBLEM", "THE ROUTESHIP SOLUTION", "CORE FEATURES", "COURIER PARTNERS",
      "INTEGRATIONS", "HOW IT WORKS", "SHIPPING CALCULATOR", "CUSTOMER STORIES", "SIMPLE PRICING",
      "FAQ", "Move with",
    ];
    const bodyText = await evaluate("document.body.innerText");
    requiredCopy.forEach((copy) => assert.ok(bodyText.includes(copy), `Missing required section: ${copy}`));
    assert.equal(await evaluate("document.querySelectorAll('.webgl canvas').length"), 1, "Three.js canvas should render");
    assert.equal(await evaluate("document.querySelectorAll('.feature-card').length"), 6);
    assert.equal(await evaluate("document.querySelectorAll('.price-card').length"), 3);
    assert.equal(await evaluate("document.querySelectorAll('.partner-grid img').length"), 6, "Courier logos should render");
    assert.equal(await evaluate("document.querySelectorAll('.momentum-rail').length"), 1, "Advertising motion rail should render");
    assert.equal(await evaluate("document.querySelector('.logo img').src.includes('routeship-logo-transparent.png')"), true, "Transparent logo should be used");
    assert.equal(await evaluate("document.querySelector('.avatar img') !== null"), true, "Testimonial portrait should render");

    const initialRate = await evaluate("document.querySelector('.estimate strong').innerText");
    await evaluate(`(() => {
      const range = document.querySelector('#weight');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(range, '10');
      range.dispatchEvent(new Event('input', { bubbles: true }));
      range.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('.segments button:last-child').click();
    })()`);
    await delay(250);
    const updatedRate = await evaluate("document.querySelector('.estimate strong').innerText");
    assert.notEqual(updatedRate, initialRate, "Calculator estimate should respond to controls");

    await evaluate("document.querySelectorAll('.faq-item button')[1].click()");
    assert.equal(await evaluate("document.querySelectorAll('.faq-item')[1].classList.contains('open')"), true, "FAQ should expand");

    const trackingText = await navigate("/tracking");
    assert.ok(trackingText.includes("Follow every move."));
    assert.ok(trackingText.includes("RS78254019"));
    assert.equal(await evaluate("document.querySelectorAll('.timeline-event').length"), 5);

    const rateText = await navigate("/rate-calculator");
    assert.ok(rateText.includes("Clear rates."));
    assert.equal(await evaluate("document.querySelectorAll('.page-hero .webgl canvas').length"), 1, "Rate calculator WebGL should render");
    const firstCourierPrice = await evaluate("document.querySelector('.courier-result > strong').innerText");
    await evaluate(`(() => {
      const input = document.querySelector('input[type="number"]');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, '12');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('.page-form button[type="submit"]').click();
    })()`);
    await delay(200);
    assert.notEqual(await evaluate("document.querySelector('.courier-result > strong').innerText"), firstCourierPrice);

    const weightText = await navigate("/weight-calculator");
    assert.ok(weightText.includes("Measure once."));
    assert.equal(await evaluate("document.querySelectorAll('.weight-results strong').length"), 2);
    assert.equal(await evaluate("document.querySelectorAll('.page-hero .webgl canvas').length"), 1, "Weight calculator WebGL should render");

    const loginText = await navigate("/login");
    assert.ok(loginText.includes("Welcome back."));
    assert.equal(await evaluate("document.querySelectorAll('.auth-form input').length >= 2"), true);

    const contactText = await navigate("/contact");
    assert.ok(contactText.includes("Your next route."));
    assert.equal(await evaluate("document.querySelectorAll('.contact-form input').length"), 3);

    await navigate("/");

    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.menu-button')).display !== 'none'"), true, "Mobile menu should be available");
  } finally {
    cdp?.close();
    chrome.kill("SIGKILL");
    devServer?.kill("SIGTERM");
    await delay(500);
    await rm(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 });
  }
}

await run();
console.log("RouteShip smoke tests passed");
