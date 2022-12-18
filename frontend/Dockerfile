FROM node:lts as builder

WORKDIR /app

COPY . .

RUN yarn install \
  --prefer-offline \
  --frozen-lockfile \
  --non-interactive \
  --production=false

RUN yarn build


FROM node:lts

ENV NODE_ENV production

WORKDIR /app

COPY --from=builder /app  .

RUN sudo yarn global add pm2 --prefix /usr/local

ENV HOST 0.0.0.0
EXPOSE 3000

CMD [ "pm2-runtime", ".output/server/index.mjs" ]
