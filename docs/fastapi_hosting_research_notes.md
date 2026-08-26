# FastAPI Hosting Research Notes

## Official deployment findings

Render documents Python 3 FastAPI deployment as a Web Service with `pip install -r requirements.txt` and `uvicorn main:app --host 0.0.0.0 --port $PORT`. Its documentation also states that custom domains are configured from the service networking area.

Railway documents FastAPI deployment from a linked GitHub repository, command-line deployment, or a Dockerfile. A deployed service can receive a public endpoint through its Networking settings; service configuration may live in `railway.toml` or `railway.json`.

Koyeb documents GitHub-driven FastAPI deployment, Python application detection from `requirements.txt`, a Uvicorn run command, a default Nano service size, and an alternative container-image deployment route.

## Workforce Hub fit criteria

The target host must support a private GitHub repository, Python/FastAPI, environment secrets, outbound access to the existing TiDB/MySQL-compatible database and storage/AI services, HTTPS custom domains (`vertonsolutions.live` and `www`), file uploads, and a migration path that does not expose protected workforce data. A free or scale-to-zero service may be useful for a proof of concept but may add cold starts and is less appropriate for an authenticated production portal.

## Official entry-pricing findings

Railway's pricing page currently presents a 30-day trial with $5 credits followed by a $1/month entry price, $5 monthly included usage credit, and metered CPU, memory, storage, and egress after included usage. Its Hobby plan is listed with a $5 monthly minimum and includes the same $5 usage credit.

Render's pricing page presents a free Hobby workspace and states that free compute is designed for exploring, personal projects, and previews rather than production use. The same page presents a $25/month Pro workspace fee plus compute for production-grade applications.
