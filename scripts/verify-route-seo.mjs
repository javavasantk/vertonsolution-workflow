const DEVTOOLS = "http://localhost:9222";
const appOrigin = "http://localhost:3000";
const routes = ["/", "/courses", "/aeroforge"];
let id = 0;
const pending = new Map();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const browserInfo = await (await fetch(`${DEVTOOLS}/json/version`)).json();
const ws = new WebSocket(browserInfo.webSocketDebuggerUrl);
ws.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  const key = `${message.sessionId ?? "root"}:${message.id}`;
  const resolver = pending.get(key);
  if (resolver) { pending.delete(key); resolver(message); }
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
  const output = [];
  for (const route of routes) {
    await send("Page.navigate", { url: `${appOrigin}${route}` }, sessionId);
    let metadata;
    for (let attempt = 0; attempt < 40; attempt++) {
      const result = await send("Runtime.evaluate", { expression: `JSON.stringify({title: document.title, canonical: document.querySelector('link[rel="canonical"]')?.href, ogUrl: document.querySelector('meta[property="og:url"]')?.content, keywords: document.querySelector('meta[name="keywords"]')?.content, routeSchema: document.querySelector('#polaris-route-schema')?.textContent})`, returnByValue: true }, sessionId);
      metadata = JSON.parse(result.result.value ?? "{}");
      const expected = `https://projectpolaris.live${route === "/" ? "/" : route}`;
      if (metadata.canonical === expected && metadata.ogUrl === expected && metadata.keywords && metadata.routeSchema) break;
      await sleep(150);
    }
    const expected = `https://projectpolaris.live${route === "/" ? "/" : route}`;
    if (metadata?.canonical !== expected || metadata?.ogUrl !== expected || !metadata?.keywords?.includes("aerospace") || !metadata?.routeSchema?.includes('"@type":"WebPage"')) throw new Error(`Route ${route} emitted incomplete metadata: ${JSON.stringify(metadata)}`);
    output.push({ route, ...metadata });
  }
  console.log(JSON.stringify({ verified: output }));
  await send("Target.closeTarget", { targetId: target.targetId });
  await send("Target.disposeBrowserContext", { browserContextId: context.browserContextId });
} finally {
  ws.close();
}
