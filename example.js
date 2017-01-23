const combine = require('depject')
const values = require('object-values')
const pull = require('pull-stream')
const Log = require('catstack-log')
const vas = require('vas')

const http = require('./')

const data = {
  gives: 'data',
  create: () => () => ({
    1: 'human',
    2: 'computer',
    3: 'JavaScript'
  })
}

const things = vas.Service({
  name: 'things',
  needs: {
    data: 'first'
  },
  manifest: {
    all: {
      type: 'source',
      http: {
        route: '/things',
        statusCode: 418,
        responseHeaders: {
          'cat': 'meow'
        }
      }
    },
    get: {
      type: 'async',
      http: {
        route: '/things/:id'
      }
    }
  },
  create: function (api) {
    const data = api.data()

    return {
      methods: { all, get }
    }

    function all () {
      const things = values(data)
      return pull.values(things)
    }

    function get ({ id }, cb) {
      cb(null, data[id])
    }
  }
})

const combinedModules = combine({ data, things, http, Log })

combinedModules.vas.start.map(start => start())
