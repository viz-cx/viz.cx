# [VIZ.cx](https://viz.cx/)

This site is just yet another entrypoint to show posts inside [VIZ blockchain](https://github.com/VIZ-Blockchain/viz-cpp-node?tab=readme-ov-file#introducing-viz) that posted via [Voice protocol](https://github.com/VIZ-Blockchain/Free-Speech-Project/blob/master/specification.md).

## Frontend

Frontend is created on top of [Nuxt.js framework](https://nuxt.com) with [Vuetify.js](https://vuetifyjs.com/en/) and [viz-js-lib](https://github.com/VIZ-Blockchain/viz-js-lib) to interact with VIZ blockchain on client-side.

## API

The API lives in `api/`. It's built on [FastAPI](https://github.com/tiangolo/fastapi) and uses [viz-python-lib](https://github.com/VIZ-Blockchain/viz-python-lib) to obtain data from VIZ blockchain server-side.

It also ships an in-browser API playground at `/playground/` — see [`api/README.md`](api/README.md#playground).

## Community

Join our telegram group [t.me/viz_cx](https://t.me/viz_cx)
