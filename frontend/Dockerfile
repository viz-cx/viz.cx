FROM node:16-alpine as builder

WORKDIR /app

COPY ./ ./

RUN yarn install \
  --prefer-offline \
  --frozen-lockfile \
  --non-interactive \
  --production=false

RUN yarn build

RUN rm -rf node_modules && \
  NODE_ENV=production yarn install \
  --prefer-offline \
  --pure-lockfile \
  --non-interactive \
  --production=true


FROM node:16-alpine

ENV NODE_ENV production

WORKDIR /app

COPY --from=builder /app ./

RUN yarn global add pm2 --prefix /usr/local

ENV HOST 0.0.0.0
EXPOSE 3000

CMD [ "pm2-runtime", ".output/server/index.mjs" ]
