FROM node:lts as builder

WORKDIR /app

COPY . .

RUN yarn install \
  --prefer-offline \
  --frozen-lockfile \
  --non-interactive \

RUN yarn build


FROM node:lts

NODE_ENV=production

WORKDIR /app

COPY --from=builder /app  .

ENV HOST 0.0.0.0
EXPOSE 3000

CMD [ "node", ".output/server/index.mjs" ]