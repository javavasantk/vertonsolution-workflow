/** Controlled end-to-end auth verification against the actual React UI. */
const DEVTOOLS = "http://localhost:9222";
let commandId = 0;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const target = await (await fetch(`${DEVTOOLS}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
ws.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  const handler = pending.get(message.id);
  if (handler) { pending.delete(message.id); handler(message); }
});
await new Promise((resolve, reject) => { ws.addEventListener("open", resolve); ws.addEventListener("error", reject); });

function send(method, params = {}) {
  const id = ++commandId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, message => message.error ? reject(new Error(message.error.message)) : resolve(message.result)));
}
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function waitFor(predicate, detail) {
  for (let attempt = 0; attempt < 40; attempt++) {
    if (await evaluate(predicate)) return;
    await delay(200);
  }
  throw new Error(`Timed out waiting for ${detail}`);
}
function setValue(name, value) {
  return `(() => { const el = document.querySelector('[name="${name}"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); })();`;
}

try {
  await send("Network.clearBrowserCookies");
  await send("Page.navigate", { url: "http://localhost:3000/portal" });
  await waitFor("window.location.pathname === '/auth'", "unauthenticated redirect to /auth");
  await waitFor("Boolean(document.querySelector('form'))", "auth form");
  const nativeValidationBlocksEmptyForm = await evaluate("document.querySelector('form').reportValidity() === false");
  if (!nativeValidationBlocksEmptyForm) throw new Error("Auth form did not block an empty submission");

  await evaluate(`${setValue("name", "UI Auth Validation")} ${setValue("email", "ui-auth-validation@example.invalid")} ${setValue("password", "safe-validation-password")}`);
  await evaluate("document.querySelector('button[type=submit]').click()");
  await waitFor("window.location.pathname === '/portal' && document.body.innerText.includes('Workspace access confirmed')", "workspace after signup");
  const meAfterSignup = await evaluate("fetch('/api/trpc/auth.me').then(response => response.json())");
  if (!meAfterSignup?.result?.data?.json?.email?.includes("ui-auth-validation")) throw new Error("JWT cookie session was not available to auth.me");

  await evaluate("fetch('/api/trpc/auth.logout', {method:'POST', headers:{'content-type':'application/json'}, body:'{}'}).then(response => response.json())");
  const meAfterLogout = await evaluate("fetch('/api/trpc/auth.me').then(response => response.json())");
  if (meAfterLogout?.result?.data?.json !== null) throw new Error("Logout did not clear the session cookie");

  await send("Page.navigate", { url: "http://localhost:3000/auth?next=/portal" });
  await waitFor("Boolean(document.querySelector('form'))", "sign-in page");
  await evaluate("Array.from(document.querySelectorAll('button')).find(button => button.innerText.trim() === 'Sign In').click()");
  await waitFor("!document.querySelector('[name=name]')", "sign-in fields");
  await evaluate(`${setValue("email", "ui-auth-validation@example.invalid")} ${setValue("password", "incorrect-password")}`);
  await evaluate("document.querySelector('button[type=submit]').click()");
  await waitFor("document.body.innerText.includes('Sign-in failed')", "incorrect-password rejection");
  await evaluate(setValue("password", "safe-validation-password"));
  await evaluate("document.querySelector('button[type=submit]').click()");
  await waitFor("window.location.pathname === '/portal' && document.body.innerText.includes('Workspace access confirmed')", "workspace after sign-in");
  const meAfterSignIn = await evaluate("fetch('/api/trpc/auth.me').then(response => response.json())");
  if (!meAfterSignIn?.result?.data?.json?.email?.includes("ui-auth-validation")) throw new Error("Sign-in did not create a JWT cookie session");

  await evaluate("fetch('/api/trpc/auth.logout', {method:'POST', headers:{'content-type':'application/json'}, body:'{}'}).then(response => response.json())");

  console.log(JSON.stringify({
    protectedRedirect: true,
    nativeValidationBlocksEmptyForm,
    signupRedirectedToWorkspace: true,
    jwtCookieSessionVerified: true,
    logoutClearedSession: true,
    incorrectPasswordRejected: true,
    signInRedirectedToWorkspace: true,
  }));
} finally {
  ws.close();
}
