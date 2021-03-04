const test = require('ava')
const bruceGulpWorkflow = require('..')

// TODO: Implement module test
test('<test-title>', t => {
  const err = t.throws(() => bruceGulpWorkflow(100), TypeError)
  t.is(err.message, 'Expected a string, got number')

  t.is(bruceGulpWorkflow('w'), 'w@zce.me')
  t.is(bruceGulpWorkflow('w', { host: 'wedn.net' }), 'w@wedn.net')
})
