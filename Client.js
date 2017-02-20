const assign = require('object-assign')
const Url = require('url')
const { join } = require('path')
const { get } = require('libnested')
const QueryString = require('query-string')
const jsonStringify = require('fast-safe-stringify')
const pullJson = require('pull-json-doubleline')
const pullHttpClient = require('pull-http-client')
const pull = require('pull-stream')
const pathToRegExp = require('path-to-regexp')
const defined = require('defined')

module.exports = function setupClient (context = {}) {
  const {
    serialize = pullJson,
    baseUrl = '/'
  } = context

  Client.key = 'http'

  return Client

  function Client ({ manifest, adapter }) {
    return handler

    function handler ({ type, path, options = {} }) {
      const httpOptions = get(adapter, path) || {}
      const base = typeof baseUrl === 'object' ? baseUrl : Url.parse(baseUrl)

      const {
        route,
        method,
        requestType = 'json',
        responseType = 'json',
        requestHeaders
      } = httpOptions

      const urlPath = route
        ? routeToPath(route)(options)
        : path.join('/')

      var query = {}
      for (const key in options) {
        query[key] = jsonStringify(options[key])
      }

      const url = Url.format({
        protocol: base.protocol,
        host: base.host,
        pathname: join(
          base.pathname || '/',
          urlPath
        ),
        search: Object.keys(query).length > 0
          ? '?' + QueryString.stringify(query)
          : null
      })

      var requestOpts = assign({
        url,
        method,
        headers: requestHeaders || {}
      })

      switch (type) {
        case 'async':
        case 'sync':
          if (responseType === 'json') {
            requestOpts.headers['accept'] || requestOpts.headers['Accept'] || (requestOpts.headers['Accept'] = 'application/json') // Don't override existing accept header declared by user
          }
          return (cb) => pullHttpClient.async(requestOpts, function (err, data) {
            if (err) return cb(err)
            if (responseType === 'json') {
              try {
                data = JSON.parse(data)
              } catch (err) {
                return cb(err)
              }
            }
            handleData(data, cb)
          })
        case 'source':
          return pull(
            pullHttpClient.source(requestOpts),
            requestType === 'json'
              ? pull(
                serialize.parse(),
                pull.asyncMap(handleData)
              )
              : pull.through()
          )
        case 'sink':
          requestOpts.method = defined(requestOpts.method, 'POST')
          requestOpts.responseType = defined(requestOpts.responseType, 'json')
          return pullHttpClient.sink(requestOpts)
        default:
          throw new Error(`vas-http: ${type} is not a type of service method call.`)
      }
    }
  }
}

function handleData (data, cb) {
  if (data.error) {
    cb(data.error)
  } else if (data.value) {
    cb(null, data.value)
  }
}

// TODO memoize
function routeToPath (route) {
  const tokens = pathToRegExp.parse(route)
  const toPath = pathToRegExp.compile(route)
  return function (options) {
    const path = toPath(options)
    tokens.forEach(token => delete options[token.name])
    return path
  }
}
