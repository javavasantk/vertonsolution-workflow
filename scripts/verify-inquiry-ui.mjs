/**
 * Controlled UI verification for public inquiry forms.
 * Uses the sandbox browser's DevTools protocol, drives the actual React form,
 * observes the visible submit state/toast, and emits only a short result JSON.
 */

const DEVTOOLS = "http://localhost:9222";
let commandId = 0;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function createVerificationTarget() {
  const response = await fetch(`${DEVTOOLS}/json/new?about:blank`, { method: "PUT" });
  if (!response.ok) throw new Error(`Could not create browser target (${response.status})`);
  return response.json();
}

function connect(url) {
  const ws = new WebSocket(url);
  const pending = new Map();
  ws.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    const resolve = pending.get(message.id);
    if (resolve) {
      pending.delete(message.id);
      resolve(message);
    }
  });
  return new Promise((resolve, reject) => {
    ws.addEventListener("open", () => resolve({
      send(method, params = {}) {
        const id = ++commandId;
        ws.send(JSON.stringify({ id, method, params }));
        return new Promise((res, rej) => {
          pending.set(id, message => {
            if (message.error) rej(new Error(message.error.message));
            else res(message.result);
          });
        });
      },
      close() { ws.close(); },
    }));
    ws.addEventListener("error", () => reject(new Error("DevTools websocket connection failed")));
  });
}

async function evalValue(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(cdp, predicate, description) {
  for (let i = 0; i < 30; i++) {
    if (await evalValue(cdp, predicate)) return;
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${description}`);
}

async function verifyForm(cdp, pageUrl, values) {
  await cdp.send("Page.navigate", { url: pageUrl });
  await waitFor(cdp, "Boolean(document.querySelector('form'))", "inquiry form");
  await delay(350);

  const validationBlocked = await evalValue(cdp, "document.querySelector('form').reportValidity() === false");
  if (!validationBlocked) throw new Error("Required-field validation did not block an empty inquiry form");

  const setValues = Object.entries(values)
    .map(([name, value]) => `
      (() => {
        const el = document.querySelector('[name="${name}"]');
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      })();`)
    .join("\n");
  await evalValue(cdp, setValues);
  await evalValue(cdp, "document.querySelector('button[type=submit]').click()");
  await waitFor(cdp, "document.body.innerText.includes('Inquiry received') || document.body.innerText.includes('School inquiry received')", "success toast");

  return evalValue(cdp, `({
    submitState: document.querySelector('button[type=submit]').innerText,
    successToast: document.body.innerText.includes('Inquiry received') || document.body.innerText.includes('School inquiry received'),
    validationBlocked: ${validationBlocked}
  })`);
}

const target = await createVerificationTarget();
const cdp = await connect(target.webSocketDebuggerUrl);

try {
  const contact = await verifyForm(cdp, "http://localhost:3000/contact", {
    name: "UI Contact Validation",
    email: "ui-contact-validation@example.invalid",
    organisation: "Project Polaris QA",
    topic: "Contact form verification",
    message: "This controlled browser validation exercises the real Project Polaris contact inquiry form.",
  });
  const school = await verifyForm(cdp, "http://localhost:3000/schools#inquiry", {
    name: "UI School Validation",
    email: "ui-school-validation@example.invalid",
    organisation: "Project Polaris QA School",
    topic: "School form verification",
    message: "This controlled browser validation exercises the real Project Polaris school inquiry form.",
  });
  console.log(JSON.stringify({ contact, school }));
} finally {
  cdp.close();
}
