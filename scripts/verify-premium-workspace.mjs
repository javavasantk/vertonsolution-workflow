/** Controlled validation of the Builder/Squad Pro-only workspace capabilities. */
const DEVTOOLS = "http://localhost:9222";
let commandId = 0;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const target = await (await fetch(`${DEVTOOLS}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
ws.addEventListener("message", event => { const message = JSON.parse(event.data); const handler = pending.get(message.id); if (handler) { pending.delete(message.id); handler(message); } });
await new Promise((resolve, reject) => { ws.addEventListener("open", resolve); ws.addEventListener("error", reject); });
function send(method, params = {}) { const id = ++commandId; ws.send(JSON.stringify({ id, method, params })); return new Promise((resolve, reject) => pending.set(id, message => message.error ? reject(new Error(message.error.message)) : resolve(message.result))); }
async function evaluate(expression) { const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result.value; }
async function waitFor(predicate, label) { for (let i = 0; i < 100; i++) { if (await evaluate(predicate)) return; await delay(250); } throw new Error(`Timed out waiting for ${label}`); }
function setValue(selector, value, tag = "HTMLInputElement") { return `(() => { const el = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(${tag}.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); })();`; }
try {
  await send("Page.navigate", { url: "http://localhost:3000/aeroforge" });
  await waitFor("document.body?.innerText?.includes('AeroForge') && document.body?.innerText?.includes('Save Trial')", "Builder-enabled AeroForge lab");
  await evaluate("Array.from(document.querySelectorAll('button')).find(button => button.innerText.includes('Execute Analytical Flow Solver')).click()");
  await evaluate("Array.from(document.querySelectorAll('button')).find(button => button.innerText.trim() === 'Save Trial').click()");
  await waitFor("document.body?.innerText?.includes('AeroForge trial saved')", "saved trial confirmation");

  const me = await evaluate("fetch('/api/trpc/auth.me').then(response => response.json())");
  const userId = me?.result?.data?.json?.id;
  if (!userId) throw new Error("Validation account session is not available");
  const trials = await evaluate("fetch('/api/trpc/aeroforge.list').then(response => response.json())");
  const trialId = trials?.result?.data?.json?.[0]?.id;
  if (!trialId) throw new Error("Saved validation trial was not available for completion evidence");
  const catalogSlug = "rockets-propulsion-fundamentals";
  const completion = await evaluate(`fetch('/api/trpc/admin.recordCompletion?batch=1', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({'0':{json:{userId:${userId}, catalogSlug:${JSON.stringify("rockets-propulsion-fundamentals")}, trialId:${trialId}}}})}).then(response => response.json())`);
  if (!completion?.[0]?.result?.data?.json?.course?.title) throw new Error("Verified completion was not recorded");
  const issued = await evaluate(`fetch('/api/trpc/admin.issueCertificate?batch=1', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({'0':{json:{userId:${userId}, catalogSlug:${JSON.stringify("rockets-propulsion-fundamentals")}}}})}).then(response => response.json())`);
  if (!issued?.[0]?.result?.data?.json?.verified) throw new Error("Certificate issue operation was not accepted");

  await send("Page.navigate", { url: "http://localhost:3000/portal" });
  await waitFor("document.body?.innerText?.includes('Transonic Airfoil Flow') && document.body?.innerText?.includes('Fundamentals of Rockets & Propulsion Technology')", "trial and certificate in workspace after reload");
  await waitFor("Boolean(document.querySelector('textarea'))", "Squad Pro Co-Pilot input");
  await evaluate(setValue('textarea', 'What engineering assumption should I document before comparing this reduced-order transonic result to a wind-tunnel test?', 'HTMLTextAreaElement'));
  await evaluate("document.querySelector('form textarea').closest('form').querySelector('button').click()");
  await waitFor("fetch('/api/trpc/workspace.copilotMessages').then(response => response.json()).then(payload => (payload.result?.data?.json ?? []).some(message => message.role === 'assistant'))", "Co-Pilot response");
  const messages = await evaluate("fetch('/api/trpc/workspace.copilotMessages').then(response => response.json())");
  const history = messages?.result?.data?.json ?? [];
  if (!history.some(message => message.role === 'assistant') || !history.some(message => message.role === 'user')) throw new Error("Co-Pilot messages were not persisted");
  await send("Page.navigate", { url: "http://localhost:3000/portal" });
  await waitFor("document.body?.innerText?.includes('What engineering assumption should I document')", "Co-Pilot history after reload");
  console.log(JSON.stringify({ trialSavedAndRendered: true, certificateIssuedAndRendered: true, copilotRespondedAndPersisted: true }));
} finally { ws.close(); }
