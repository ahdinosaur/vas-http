const combine = require('depject')
const values = require('object-values')
const pull = require('pull-stream')
const { createServer: Server } = require('http')
const Send = require('http-sender')()
const vas = require('vas')
const vasHttp = require('./')

const data = {
  1: 'human',
  2: 'computer',
  3: 'JavaScript'
}

const things = {
  path: ['things'],
  manifest: {
    all: 'source',
    get: 'async'
  },
  methods: {
    all: function () {
      const things = values(data)
      return pull.values(things)
    },
    get: function ({ id }, cb) {
      cb(null, data[id])
    }
  },
  adapter: {
    http: {
      all: {
        route: '/things',
        statusCode: 418,
        responseHeaders: {
          'cat': 'meow'
        }
      },
      get: {
        route: '/things/:id'
      }
    }
  }
}

const definitions = [things]
const services = definitions.map(vas.Service)
const service = vas.combine(services)
const httpHandler = vas.Server(vasHttp.Server, service)

Server((req, res) => {
  httpHandler(req, res, {}, Send(req, res))
}).listen(5000)
