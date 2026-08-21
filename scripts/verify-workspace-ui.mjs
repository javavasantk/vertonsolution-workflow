/** Controlled browser validation of protected workspace access and backlog persistence. */
const DEVTOOLS = "http://localhost:9222";
const EMAIL = "ui-workspace-validation@example.invalid";
let commandId = 0;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const target = await (await fetch(`${DEVTOOLS}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
ws.addEventListener("message", event => { const message = JSON.parse(event.data); const handler = pending.get(message.id); if (handler) { pending.delete(message.id); handler(message); } });
await new Promise((resolve, reject) => { ws.addEventListener("open", resolve); ws.addEventListener("error", reject); });
function send(method, params = {}) { const id = ++commandId; ws.send(JSON.stringify({ id, method, params })); return new Promise((resolve, reject) => pending.set(id, message => message.error ? reject(new Error(message.error.message)) : resolve(message.result))); }
async function evaluate(expression) { const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result.value; }
async function waitFor(predicate, label) { for (let i = 0; i < 50; i++) { if (await evaluate(predicate)) return; await delay(200); } throw new Error(`Timed out waiting for ${label}`); }
function setValue(selector, value) { return `(() => { const el = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); })();`; }
try {
  await send("Network.clearBrowserCookies");
  await send("Page.navigate", { url: "http://localhost:3000/auth?next=/portal" });
  await waitFor("Boolean(document.querySelector('[name=name]'))", "sign-up fields");
  await evaluate(`${setValue('[name=name]', 'Workspace Validation')} ${setValue('[name=email]', EMAIL)} ${setValue('[name=password]', 'safe-workspace-password')}`);
  await evaluate("document.querySelector('button[type=submit]').click()");
  await waitFor("window.location.pathname === '/portal' && document.body.innerText.includes('Mission Control')", "protected workspace");
  await evaluate("Array.from(document.querySelectorAll('button')).find(button => button.innerText.includes('Add work item')).click()");
  await waitFor("Array.from(document.querySelectorAll('input')).some(input => input.placeholder.includes('Validate transonic'))", "backlog form");
  await evaluate(setValue('input[placeholder*="Validate transonic"]', 'Verify pressure coefficient assumptions'));
  await evaluate("Array.from(document.querySelectorAll('button')).find(button => button.innerText.trim() === 'Add').click()");
  await waitFor("document.body.innerText.includes('Verify pressure coefficient assumptions')", "new persisted backlog item");
  const overview = await evaluate("fetch('/api/trpc/workspace.overview').then(response => response.json())");
  const items = overview?.result?.data?.json?.backlog ?? [];
  if (!items.some(item => item.title === 'Verify pressure coefficient assumptions')) throw new Error("Workspace backlog item was not persisted");
  console.log(JSON.stringify({ protectedWorkspaceLoaded: true, backlogItemCreated: true, backlogPersisted: true }));
} finally { ws.close(); }
