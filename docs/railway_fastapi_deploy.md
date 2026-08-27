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

## External TiDB network access

The external TiDB Cloud Starter instance must be reachable before adding its `DATABASE_URL` to Railway. TiDB Starter public endpoints use firewall rules. Although a new Starter instance can initially allow all public addresses, the public path remains internet-routed and the service should be narrowed to approved sources before real workforce records are loaded. [TiDB Cloud firewall rules](https://docs.pingcap.com/tidbcloud/configure-serverless-firewall-rules-for-public-endpoints/)

Railway Static Outbound IPs are the appropriate allowlist input for a public TiDB endpoint, but Railway documents that feature for Pro-plan services. The current Hobby workspace does not display the feature. [Railway Static Outbound IPs](https://docs.railway.com/networking/static-outbound-ips)

Do **not** use `0.0.0.0/0` for a production workforce database. A TiDB private endpoint requires an AWS VPC and AWS PrivateLink; a standard Railway Hobby service cannot directly attach to that VPC. [TiDB Cloud AWS PrivateLink](https://docs.pingcap.com/tidbcloud/set-up-private-endpoint-connections-serverless/)

Until a static-egress or private-network design is in place, retain the current Manus deployment for authenticated operations and use the Railway service only for `/health` verification. Do not add a production `DATABASE_URL`, initialize workforce records, or change custom-domain DNS in that interim state.

## Current migration posture

The owner selected the **no-cutover posture** after confirming that the active Railway Hobby workspace does not expose Static Outbound IPs. As of this decision, `vertonsolutions.live` and `www.vertonsolutions.live` remain attached to the current Manus production deployment. The Railway service has successfully built `Dockerfile.railway`, started FastAPI with Uvicorn, and returned `200 OK` from `/health`, but it is a **migration preview only**.

The TiDB Cloud Starter instance remains external and uninitialized for this application. No production Workforce Hub records, raw resumes, storage credentials, AI provider credentials, or previously exposed database password may be copied into source control or shared in chat. The exposed TiDB password must be treated as compromised and replaced before any future use.

Resume the cutover only when all of the following are complete: a Railway plan or architecture offers private/statically allowlisted egress; Railway and TiDB are placed in an appropriate compatible region; a newly rotated credential is stored only in Railway's encrypted variables; the existing schema and approved demo seed are applied; private S3-compatible storage and independently provisioned AI credentials are set; and health, login, RBAC, data, resume upload, and bounded AI checks pass on the temporary Railway domain.

## Rollout and rollback

First deploy the Railway-generated domain. Confirm `/health`, `/ready`, credential login, protected workspace routing, role denial behavior, inline candidate/project updates, PDF/DOCX resume upload, and bounded assistant lookup. Only after these checks pass should `vertonsolutions.live` and `www.vertonsolutions.live` DNS records be repointed to Railway's custom-domain target.

Keep the current Manus custom-domain configuration untouched during Railway testing. If a post-cutover failure occurs, restore the previous DNS target, wait for DNS propagation, and investigate using Railway deployment logs. Do not switch DNS simply because the image built successfully.
