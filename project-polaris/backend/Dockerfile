FROM node:22-bookworm-slim AS build
WORKDIR /workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/package.json
RUN corepack enable && pnpm install --frozen-lockfile --ignore-scripts
COPY backend ./backend
COPY contracts ./contracts
RUN pnpm --filter @project-polaris/backend check && pnpm --filter @project-polaris/backend build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd --system polaris && useradd --system --gid polaris --no-create-home polaris
COPY --from=build --chown=polaris:polaris /workspace/node_modules ./node_modules
COPY --from=build --chown=polaris:polaris /workspace/backend/dist ./dist
COPY --from=build --chown=polaris:polaris /workspace/backend/package.json ./package.json
USER polaris
EXPOSE 3000
CMD ["node", "dist/main.js"]
