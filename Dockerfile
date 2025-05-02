# syntax = docker/dockerfile:1.2

FROM node:18-alpine as base 

RUN apk upgrade && \
    apk add libgcc libstdc++ && \ 
    apk add make gcc g++ python3

RUN yarn global add turbo

FROM base as builder

WORKDIR /usr/src/app

COPY . .

RUN  turbo prune kamikaze --docker

FROM base as installer

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/out/json/ .
RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn install --frozen-lockfile

COPY --from=builder /usr/src/app/out/full/ .
RUN yarn turbo run build --filter=kamikaze

FROM base as runner 

WORKDIR /usr/src/app 

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

COPY --from=installer --chown=nodejs:nodejs /usr/src/app/ .

WORKDIR /usr/src/app/servers/kamikaze

RUN npx --yes @fastify/secure-session > secret-key

CMD yarn migrate && node dist/index.cjs
