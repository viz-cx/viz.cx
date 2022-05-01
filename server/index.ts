import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { startVizParsing } from './viz-parser'
import { startMongo } from '../helpers/startMongo'
require('dotenv').config()

const host = process.env.HOST || "http://localhost"
const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

async function start() {
  await startMongo()

  app.prepare().then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url!, true)
      handle(req, res, parsedUrl)
    }).listen(port)

    // tslint:disable-next-line:no-console
    console.log(
      `> Server listening at ${host}:${port} as ${dev ? 'development' : process.env.NODE_ENV
      }`
    )
    startVizParsing()
  })
}

void start()
