const { assign } = Object
const pull = require('pull-stream')
const { get, each } = require('libnested')
const queryString = require('query-string')
const explain = require('explain-error')
const identify = require('pull-identify-filetype')
const mime = require('mime-types')
const pullJson = require('pull-json-doubleline')
const Route = require('http-routes')

// TODO
// these need to be public `vas` api's
// lib is for internal use only!
const is = require('vas/lib/is')

module.exports = HttpServer

HttpServer.key = 'http'

function HttpServer ({ handler, manifest, adapter }) {
  var routes = []
  each(manifest, (type, path) => {
    const httpOptions = get(adapter, path) || {}
    const {
      route: routePath = '/' + path.join('/'),
      responseType = 'json',
      statusCode
    } = httpOptions

    var responseHeaders = {}
    for (const key in httpOptions.responseHeaders) {
      responseHeaders[key.toLowerCase()] = httpOptions.responseHeaders[key]
    }

    const route = [routePath, (req, res, context, next) => {
      var queryParams = queryString.parse(context.url.query)
      try {
        for (const key in queryParams) {
          queryParams[key] = JSON.parse(queryParams[key])
        }
      } catch (err) {
        return next(explain(err, 'error parsing JSON in query string'))
      }
      const routeParams = context.params

      const options = assign({}, routeParams, queryParams)

      const call = { type, path, options }
      const continuableOrStream = handler(call)

      for (const key in responseHeaders) {
        res.setHeader(key, responseHeaders[key])
      }

      if (statusCode) {
        res.statusCode = statusCode
      }

      if (is.requestType(type)) {
        const continuable = continuableOrStream
        continuable((err, value = null) => {
          if (err) next(err)
          else next(null, { value })
        })
      } else if (is.streamType(type)) {
        var stream = continuableOrStream
        if (is.sourceType(type)) {
          if (responseType === 'json') {
            if (responseHeaders['content-type'] === undefined) {
              res.setHeader('Content-Type', 'application/json; boundary=NLNL')
            }
            stream = pull(
              stream,
              pull.map(value => ({ value })),
              pullJson.stringify()
            )
          } else if (responseType === 'blob') {
            stream = pull(
              stream,
              responseHeaders['content-type'] === undefined
                ? identify(function (filetype) {
                  if (filetype) {
                    res.setHeader('content-type', mime.lookup(filetype))
                  } else {
                    res.setHeader('content-type', 'application/octet-stream')
                  }
                })
                : pull.through()
            )
          }
        }
        next(null, stream)
      }
    }]
    routes.push(route)
  })
  return Route(routes)
}
