const test = require('tape')

const vasHttp = require('../')

test('vas-http', function (t) {
  t.ok(vasHttp, 'module is require-able')
  t.end()
})
