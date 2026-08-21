const DEVTOOLS = "http://localhost:9222";
const productionOrigin = "http://localhost:3101";
let id = 0;
const pending = new Map();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const browserInfo = await (await fetch(`${DEVTOOLS}/json/version`)).json();
const ws = new WebSocket(browserInfo.webSocketDebuggerUrl);
ws.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  const key = `${message.sessionId ?? "root"}:${message.id}`;
  const handler = pending.get(key);
  if (handler) { pending.delete(key); handler(message); }
});
await new Promise((resolve, reject) => { ws.addEventListener("open", resolve); ws.addEventListener("error", reject); });

function send(method, params = {}, sessionId) {
  const messageId = ++id;
  ws.send(JSON.stringify({ id: messageId, method, params, ...(sessionId ? { sessionId } : {}) }));
  return new Promise((resolve, reject) => pending.set(`${sessionId ?? "root"}:${messageId}`, message => message.error ? reject(new Error(message.error.message)) : resolve(message.result)));
}

try {
  const context = await send("Target.createBrowserContext");
  const target = await send("Target.createTarget", { url: "about:blank", browserContextId: context.browserContextId });
  const attached = await send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  const sessionId = attached.sessionId;
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  await send("Page.navigate", { url: `${productionOrigin}/auth` }, sessionId);

  let rendered = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    const result = await send("Runtime.evaluate", { expression: "document.body.innerText", returnByValue: true }, sessionId);
    const text = result.result.value ?? "";
    if (text.includes("Create Account") && text.includes("Sign In")) {
      rendered = true;
      if (text.includes("demo@projectpolaris.local") || text.includes("Development demo access")) {
        throw new Error("Production login UI exposed development demo credentials");
      }
      break;
    }
    await delay(200);
  }
  if (!rendered) throw new Error("Production authentication UI did not render");
  const endpoint = await (await fetch(`${productionOrigin}/api/trpc/auth.demoCredentials?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%7D`)).json();
  if (endpoint?.[0]?.result?.data?.json !== null) throw new Error("Production auth.demoCredentials did not return null");
  console.log(JSON.stringify({ productionAuthRendered: true, demoPanelSuppressed: true, demoCredentialsEndpointSuppressed: true }));
  await send("Target.closeTarget", { targetId: target.targetId });
  await send("Target.disposeBrowserContext", { browserContextId: context.browserContextId });
} finally {
  ws.close();
}
