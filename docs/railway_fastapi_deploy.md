# Railway deployment: Verton Workforce Hub FastAPI

This deployment uses **one Railway web service**. The Railway image builds the existing React workspace and serves it from FastAPI, so the public site, API, protected resume upload endpoint, and cookie session share one origin. The Node/Manus OAuth process is not started in this topology.

## Deployment configuration

In Railway, create or edit the service connected to `javavasantk/vertonsolution-workflow`. Select the repository root as the service root, then set Railway's documented build variable `RAILWAY_DOCKERFILE_PATH=Dockerfile.railway`. This selects the non-root Dockerfile without altering the active Manus deployment. The image installs Python, builds the React application, then starts `uvicorn app.main:app` on Railway's assigned `PORT`. Railway must report a successful `GET /health` before any domain change.

| Variable group | Required Railway variables | Notes |
|---|---|---|
| Build and authentication | `RAILWAY_DOCKERFILE_PATH=Dockerfile.railway`, `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `APP_ENV=production` | Generate a high-entropy `JWT_SECRET` in Railway; do not reuse a public value. |
| Data | `DATABASE_URL` | Use the existing TiDB database URL converted to `mysql+pymysql://...`; do not run destructive migrations. |
| Browser policy | `APP_ORIGINS` | Include `https://vertonsolutions.live` and `https://www.vertonsolutions.live`; add the generated Railway domain for pre-cutover testing if a separate frontend origin is used. |
| Private resume storage | `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Bucket access must be private. The backend stores only object references and metadata in TiDB. |
| AI | `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` | Use a separately provisioned OpenAI-compatible provider. The managed Manus Forge values are not transferable to Railway. |

The complete variable names and placeholders are in [`.env.railway.example`](../.env.railway.example). Values belong in Railway's encrypted Variables UI, **not** in chat, source control, or this file.

## Rollout and rollback

First deploy the Railway-generated domain. Confirm `/health`, `/ready`, credential login, protected workspace routing, role denial behavior, inline candidate/project updates, PDF/DOCX resume upload, and bounded assistant lookup. Only after these checks pass should `vertonsolutions.live` and `www.vertonsolutions.live` DNS records be repointed to Railway's custom-domain target.

Keep the current Manus custom-domain configuration untouched during Railway testing. If a post-cutover failure occurs, restore the previous DNS target, wait for DNS propagation, and investigate using Railway deployment logs. Do not switch DNS simply because the image built successfully.
