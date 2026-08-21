/** Verifies the actual auth-page Google button begins a protected OAuth redirect. */
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
async function waitFor(predicate, detail) { for (let i = 0; i < 40; i++) { if (await evaluate(predicate)) return; await delay(200); } throw new Error(`Timed out waiting for ${detail}`); }

try {
  await send("Network.clearBrowserCookies");
  await send("Page.navigate", { url: "http://localhost:3000/auth" });
  await waitFor("Array.from(document.querySelectorAll('button')).some(button => button.innerText.includes('Continue with Google'))", "Google sign-in button");
  await evaluate("Array.from(document.querySelectorAll('button')).find(button => button.innerText.includes('Continue with Google')).click()");
  await waitFor("window.location.hostname === 'accounts.google.com'", "Google authorization page redirect");
  const cookies = await send("Network.getAllCookies");
  const nonceCookie = cookies.cookies.find(cookie => cookie.name.includes("polaris_google_state"));
  if (!nonceCookie?.httpOnly) throw new Error("Google OAuth state cookie was not established as an httpOnly cookie");
  const state = JSON.parse(Buffer.from(nonceCookie.value, "base64url").toString("utf8")).nonce;
  if (!state) throw new Error("Google OAuth state cookie did not contain a nonce");
  await send("Page.navigate", { url: `http://localhost:3000/api/auth/google/callback?code=controlled-invalid-code&state=${encodeURIComponent(state)}` });
  await waitFor("window.location.pathname === '/auth' && new URLSearchParams(window.location.search).get('google') === 'error'", "Google callback error redirect");
  await waitFor("document.body.innerText.includes('Google sign-in could not be completed')", "Google callback recovery guidance");
  const errorGuidanceVisible = await evaluate("document.body.innerText.includes('Google sign-in could not be completed')");
  if (!errorGuidanceVisible) throw new Error("Google callback error guidance was not visible in the auth UI");
  console.log(JSON.stringify({ authorizationRedirectedToGoogle: true, stateCookieHttpOnly: nonceCookie.httpOnly, stateCookieSameSite: nonceCookie.sameSite, callbackErrorRedirectedSafely: true, errorGuidanceVisible }));
} finally {
  ws.close();
}
