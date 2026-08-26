# Railway FastAPI Migration Notes

The Railway service currently starts the Node artifact (`node dist/index.js`) and fails because its OAuth-specific environment setting is absent. A FastAPI deployment must not reuse the Node OAuth runtime contract.

The current React client uses `httpBatchLink` against `/api/trpc` with SuperJSON. To preserve the existing UI during a staged cutover, the FastAPI service needs either a compatibility route for existing procedure names and envelopes or a completed frontend REST-client migration. The initial Railway migration should use a FastAPI compatibility layer while the frontend contract is migrated deliberately.

The FastAPI service requires independently configured Railway secrets: a JWT signing secret; a MySQL/TiDB connection string in SQLAlchemy format; S3-compatible storage credentials and bucket for private resume uploads; an OpenAI-compatible managed AI base URL, API key, and model; and allowed CORS origins for the custom domain. Existing Manus OAuth and Forge values cannot be copied into Railway by default.
