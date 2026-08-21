import { writeFile } from "node:fs/promises";

const DEVTOOLS = "http://localhost:9222";
let commandId = 0;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const target = await (await fetch(`${DEVTOOLS}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
ws.addEventListener("message", event => { const message = JSON.parse(event.data); const handler = pending.get(message.id); if (handler) { pending.delete(message.id); handler(message); } });
await new Promise((resolve, reject) => { ws.addEventListener("open", resolve); ws.addEventListener("error", reject); });
function send(method, params = {}) { const id = ++commandId; ws.send(JSON.stringify({ id, method, params })); return new Promise((resolve, reject) => pending.set(id, message => message.error ? reject(new Error(message.error.message)) : resolve(message.result))); }
async function evaluate(expression) { const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); return result.result.value; }
async function waitFor(expression, label) { for (let i = 0; i < 50; i++) { if (await evaluate(expression)) return; await delay(150); } throw new Error(`Timed out waiting for ${label}`); }
try {
  await send("Page.navigate", { url: process.env.THEME_REVIEW_URL || "http://localhost:3000/" });
  await waitFor("Boolean(document.querySelector('[aria-label=\"Switch to light theme\"], [aria-label=\"Switch to dark theme\"]'))", "theme toggle");
  const startsLight = await evaluate("Boolean(document.querySelector('[aria-label=\"Switch to dark theme\"]'))");
  if (startsLight) {
    await evaluate("document.querySelector('[aria-label=\"Switch to dark theme\"]').click()");
    await waitFor("Boolean(document.querySelector('[aria-label=\"Switch to light theme\"]'))", "dark theme toggle");
  }
  const darkSurface = await evaluate("getComputedStyle(document.body).backgroundColor");
  await evaluate("document.querySelector('[aria-label=\"Switch to light theme\"]').click()");
  await waitFor("Boolean(document.querySelector('[aria-label=\"Switch to dark theme\"]'))", "light theme toggle");
  const lightSurface = await evaluate("getComputedStyle(document.body).backgroundColor");
  if (darkSurface === lightSurface) throw new Error("Theme switch did not change the computed body surface");
  if (process.env.SCREENSHOT_PATH) {
    const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    await writeFile(process.env.SCREENSHOT_PATH, Buffer.from(screenshot.data, "base64"));
  }
  if (!process.env.KEEP_LIGHT) await evaluate("document.querySelector('[aria-label=\"Switch to dark theme\"]').click()");
  console.log(JSON.stringify({ darkSurface, lightSurface, themeToggleVerified: true, lightModePreserved: Boolean(process.env.KEEP_LIGHT), screenshotPath: process.env.SCREENSHOT_PATH ?? null }));
} finally { ws.close(); }
