# vas-http

http server and client for [vas@3.0.0](https://github.com/ahdinosaur/vas/tree/v3)

```shell
npm install --save ahdinosaur/vas-http
```

## example

```js
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
```

```txt
$ curl -i 'http://localhost:5000/things'
HTTP/1.1 418 I'm a teapot
cat: meow
Content-Type: application/json; boundary=NLNL
Date: Mon, 23 Jan 2017 12:45:52 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{
  "value": "human"
}

{
  "value": "computer"
}

{
  "value": "JavaScript"
}
```

```txt
$ curl -i 'http://localhost:5000/things/1'  
HTTP/1.1 200 OK
content-type: application/json
Date: Mon, 23 Jan 2017 12:46:46 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{"value":"human"}
```

## usage

### `Http = require('vas-http')`

## license

The Apache License

Copyright &copy; 2017 Michael Williams

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
