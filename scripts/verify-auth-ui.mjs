/** Controlled end-to-end auth verification against the actual React UI. */
const DEVTOOLS = "http://localhost:9222";
let commandId = 0;
const testEmail = `ui-auth-validation-${Date.now()}@example.invalid`;
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

  await evaluate("Array.from(document.querySelectorAll('button')).find(button => button.innerText.trim() === 'Sign In').click()");
  await waitFor("document.body.innerText.includes('demo@projectpolaris.local')", "development demo credentials");
  await evaluate(`${setValue("email", "demo@projectpolaris.local")} ${setValue("password", "PolarisDemo!2026")}`);
  await evaluate("document.querySelector('button[type=submit]').click()");
  await waitFor("window.location.pathname === '/portal' && document.body.innerText.includes('Build with evidence')", "workspace after development demo sign-in");
  const demoSession = await evaluate("fetch('/api/trpc/auth.me').then(response => response.json())");
  if (demoSession?.result?.data?.json?.email !== "demo@projectpolaris.local") throw new Error("Development demo account did not establish a session");
  await evaluate("fetch('/api/trpc/auth.logout', {method:'POST', headers:{'content-type':'application/json'}, body:'{}'}).then(response => response.json())");
  await send("Page.navigate", { url: "http://localhost:3000/auth?next=/portal" });
  await waitFor("Boolean(document.querySelector('[name=name]'))", "signup mode after demo logout");

  await evaluate(`${setValue("name", "UI Auth Validation")} ${setValue("email", testEmail)} ${setValue("password", "safe-validation-password")}`);
  await evaluate("document.querySelector('button[type=submit]').click()");
  await waitFor("window.location.pathname === '/portal' && document.body.innerText.includes('Build with evidence')", "workspace after signup");
  const meAfterSignup = await evaluate("fetch('/api/trpc/auth.me').then(response => response.json())");
  if (meAfterSignup?.result?.data?.json?.email !== testEmail) throw new Error("JWT cookie session was not available to auth.me");

  await evaluate("fetch('/api/trpc/auth.logout', {method:'POST', headers:{'content-type':'application/json'}, body:'{}'}).then(response => response.json())");
  const meAfterLogout = await evaluate("fetch('/api/trpc/auth.me').then(response => response.json())");
  if (meAfterLogout?.result?.data?.json !== null) throw new Error("Logout did not clear the session cookie");

  await send("Page.navigate", { url: "http://localhost:3000/auth?next=/portal" });
  await waitFor("Boolean(document.querySelector('form'))", "sign-in page");
  await evaluate("Array.from(document.querySelectorAll('button')).find(button => button.innerText.trim() === 'Sign In').click()");
  await waitFor("!document.querySelector('[name=name]')", "sign-in fields");
  await evaluate(`${setValue("email", testEmail)} ${setValue("password", "incorrect-password")}`);
  await evaluate("document.querySelector('button[type=submit]').click()");
  await waitFor("document.body.innerText.includes('Sign-in failed')", "incorrect-password rejection");
  await evaluate(setValue("password", "safe-validation-password"));
  await evaluate("document.querySelector('button[type=submit]').click()");
  await waitFor("window.location.pathname === '/portal' && document.body.innerText.includes('Build with evidence')", "workspace after sign-in");
  const meAfterSignIn = await evaluate("fetch('/api/trpc/auth.me').then(response => response.json())");
  if (!meAfterSignIn?.result?.data?.json?.email?.includes("ui-auth-validation")) throw new Error("Sign-in did not create a JWT cookie session");

  await evaluate("fetch('/api/trpc/auth.logout', {method:'POST', headers:{'content-type':'application/json'}, body:'{}'}).then(response => response.json())");

  await send("Page.navigate", { url: "http://localhost:3000/auth?next=/portal" });
  await waitFor("Boolean(document.querySelector('form'))", "password recovery page");
  await evaluate("Array.from(document.querySelectorAll('button')).find(button => button.innerText.trim() === 'Sign In').click()");
  await waitFor("Array.from(document.querySelectorAll('button')).some(button => button.innerText.trim() === 'Forgot password?')", "forgot password control");
  await evaluate("Array.from(document.querySelectorAll('button')).find(button => button.innerText.trim() === 'Forgot password?').click()");
  await waitFor("document.body.innerText.includes('Send Reset Link')", "forgot password form");
  await evaluate(setValue("email", testEmail));
  await evaluate("document.querySelector('button[type=submit]').click()");
  await waitFor("Boolean(document.querySelector('a[href*=\"reset=\"]'))", "development reset link");
  const resetUrl = await evaluate("document.querySelector('a[href*=\"reset=\"]').href");
  await send("Page.navigate", { url: resetUrl });
  await waitFor("document.body.innerText.includes('Set New Password')", "password reset form");
  const passwordInputs = await evaluate("Array.from(document.querySelectorAll('input[type=password]')).length");
  if (passwordInputs !== 2) throw new Error("Password reset form did not render both password fields");
  await evaluate("(() => { const inputs = Array.from(document.querySelectorAll('input[type=password]')); for (const el of inputs) { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, 'new-safe-validation-password'); el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); } })();");
  await evaluate("document.querySelector('button[type=submit]').click()");
  await waitFor("window.location.pathname === '/portal' && document.body.innerText.includes('Build with evidence')", "workspace after reset");
  await evaluate("fetch('/api/trpc/auth.logout', {method:'POST', headers:{'content-type':'application/json'}, body:'{}'}).then(response => response.json())");
  await send("Page.navigate", { url: "http://localhost:3000/auth?next=/portal" });
  await waitFor("Boolean(document.querySelector('form'))", "post-reset sign-in");
  await evaluate("Array.from(document.querySelectorAll('button')).find(button => button.innerText.trim() === 'Sign In').click()");
  await waitFor("!document.querySelector('[name=name]')", "post-reset sign-in fields");
  await evaluate(`${setValue("email", testEmail)} ${setValue("password", "safe-validation-password")}`);
  await evaluate("document.querySelector('button[type=submit]').click()");
  await waitFor("document.body.innerText.includes('Sign-in failed')", "old password rejection after reset");
  await evaluate(setValue("password", "new-safe-validation-password"));
  await evaluate("document.querySelector('button[type=submit]').click()");
  await waitFor("window.location.pathname === '/portal' && document.body.innerText.includes('Build with evidence')", "sign-in with new password");
  await evaluate("fetch('/api/trpc/auth.logout', {method:'POST', headers:{'content-type':'application/json'}, body:'{}'}).then(response => response.json())");

  console.log(JSON.stringify({
    protectedRedirect: true,
    nativeValidationBlocksEmptyForm,
    developmentDemoSignInVerified: true,
    signupRedirectedToWorkspace: true,
    jwtCookieSessionVerified: true,
    logoutClearedSession: true,
    incorrectPasswordRejected: true,
    signInRedirectedToWorkspace: true,
    forgotPasswordResetFlowVerified: true,
    oldPasswordInvalidAfterReset: true,
  }));
} finally {
  ws.close();
}
