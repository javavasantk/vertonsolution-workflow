const browserInfo = await (await fetch("http://localhost:9222/json/version")).json();
const ws = new WebSocket(browserInfo.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();

ws.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  const key = `${message.sessionId ?? "root"}:${message.id}`;
  const resolve = pending.get(key);
  if (resolve) {
    pending.delete(key);
    resolve(message);
  }
});

await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve);
  ws.addEventListener("error", reject);
});

function send(method, params = {}, sessionId) {
  const messageId = ++id;
  ws.send(JSON.stringify({ id: messageId, method, params, ...(sessionId ? { sessionId } : {}) }));
  return new Promise((resolve, reject) => {
    pending.set(`${sessionId ?? "root"}:${messageId}`, message => {
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    });
  });
}

try {
  const context = await send("Target.createBrowserContext");
  const target = await send("Target.createTarget", { url: "http://localhost:3000/", browserContextId: context.browserContextId });
  const attached = await send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  const sessionId = attached.sessionId;
  await send("Runtime.enable", {}, sessionId);
  await new Promise(resolve => setTimeout(resolve, 400));
  const result = await send("Runtime.evaluate", {
    expression: "JSON.stringify(Array.from(document.querySelectorAll('img')).map(image => ({ src: image.currentSrc || image.src, alt: image.alt })))",
    returnByValue: true,
  }, sessionId);
  const images = JSON.parse(result.result.value ?? "[]");
  const logoImages = images.filter(image => image.src.includes("polaris-logo"));
  if (logoImages.length !== 2 || logoImages.some(image => image.alt !== "Project Polaris logo")) {
    throw new Error(`Expected two descriptive rendered logo alts, received: ${JSON.stringify(logoImages)}`);
  }
  console.log(JSON.stringify({ verified: logoImages }));
  await send("Target.closeTarget", { targetId: target.targetId });
  await send("Target.disposeBrowserContext", { browserContextId: context.browserContextId });
} finally {
  ws.close();
}
