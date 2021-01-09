'use strict'

const tap = require('tap')
const test = tap.test
const Fastify = require('fastify')
const sinon = require('sinon')
const fp = require('fastify-plugin')

const plugin = require('../')

function makeStubCasbin () {
  return fp(
    async fastify => {
      fastify.decorate(
        'casbin',
        sinon.stub({
          enforce () {}
        })
      )
    },
    {
      name: 'fastify-casbin'
    }
  )
}

test('throws if no casbin decorator exists', t => {
  t.plan(1)

  const fastify = Fastify()

  fastify.register(plugin)

  fastify.ready(err => {
    t.is(err.message, "The decorator 'casbin' is not present in Fastify")

    fastify.close()
  })
})

test('throws if fastify-casbin plugin is not registered', t => {
  t.plan(1)

  const fastify = Fastify()

  fastify.decorate('casbin', sinon.stub())
  fastify.register(plugin)

  fastify.ready(err => {
    t.is(
      err.message,
      "The dependency 'fastify-casbin' of plugin 'fastify-casbin-rest' is not registered"
    )

    fastify.close()
  })
})

test('registration succeds if fastify-casbin providing a casbin decorator exists', t => {
  t.plan(1)

  const fastify = Fastify()

  fastify.register(makeStubCasbin())
  fastify.register(plugin)

  fastify.ready(err => {
    t.error(err)
    fastify.close()
  })
})

test('ignores routes where plugin is not enabled', t => {
  t.plan(5)

  const fastify = Fastify()

  fastify.register(makeStubCasbin())
  fastify.register(plugin)

  fastify.get('/no-options', () => 'ok')
  fastify.get('/no-casbin-rest', { casbin: {} }, () => 'ok')
  fastify.get('/false-casbin-rest', { casbin: { rest: false } }, () => 'ok')

  fastify.ready(async err => {
    t.error(err)

    t.equal((await fastify.inject('/no-options')).body, 'ok')
    t.equal((await fastify.inject('/no-casbin-rest')).body, 'ok')
    t.equal((await fastify.inject('/false-casbin-rest')).body, 'ok')

    t.false(fastify.casbin.enforce.called)

    fastify.close()
  })
})

test('allows route where plugin is enabled and enforce resolves true', t => {
  t.plan(3)

  const fastify = Fastify()

  fastify.register(makeStubCasbin())
  fastify.register(plugin)

  fastify.get('/', { casbin: { rest: true } }, () => 'ok')

  fastify.ready(async err => {
    t.error(err)

    fastify.casbin.enforce.resolves(true)

    t.equal((await fastify.inject('/')).body, 'ok')

    t.ok(fastify.casbin.enforce.called)

    fastify.close()
  })
})

test('forbids route where plugin is enabled and enforce resolves false', t => {
  t.plan(3)

  const fastify = Fastify()

  fastify.register(makeStubCasbin())
  fastify.register(plugin)

  fastify.get('/', { casbin: { rest: true } }, () => 'ok')

  fastify.ready(async err => {
    t.error(err)

    fastify.casbin.enforce.resolves(false)

    t.equal((await fastify.inject('/')).statusCode, 403)

    t.ok(fastify.casbin.enforce.called)

    fastify.close()
  })
})

test('works correctly if there is an existing preHandler hook', t => {
  t.plan(4)

  let counter = 0
  const fastify = Fastify()

  fastify.register(makeStubCasbin())
  fastify.register(plugin)

  fastify.get('/', {
    preHandler: (req, reply, done) => {
      counter++
      done()
    },

    casbin: { rest: true }
  }, () => 'ok')

  fastify.ready(async err => {
    t.error(err)

    fastify.casbin.enforce.resolves(false)

    t.equal((await fastify.inject('/')).statusCode, 403)

    t.ok(fastify.casbin.enforce.called)
    t.equal(counter, 1)

    fastify.close()
  })
})

test('supports specifying custom hooks', t => {
  t.plan(4)

  let counter = 0
  const fastify = Fastify()

  fastify.register(makeStubCasbin())
  fastify.register(plugin, { hook: 'onRequest' })

  fastify.get('/', {
    preParsing: (req, reply, done) => {
      counter++
      done()
    },

    casbin: { rest: true }
  }, () => 'ok')

  fastify.ready(async err => {
    t.error(err)

    fastify.casbin.enforce.resolves(false)

    t.equal((await fastify.inject('/')).statusCode, 403)

    t.ok(fastify.casbin.enforce.called)
    t.equal(counter, 0)

    fastify.close()
  })
})

test('supports overriding plugin rules on route level', t => {
  t.plan(4)

  const fastify = Fastify()

  fastify.register(makeStubCasbin())
  fastify.register(plugin, {
    hook: 'onRequest',
    getSub: request => request.user,
    getObj: request => request.url,
    getAct: request => request.method
  })

  fastify.get('/', {
    casbin: {
      rest: {
        getSub: request => request.method,
        getObj: request => request.user,
        getAct: request => request.url
      }
    }
  }, () => 'ok')

  fastify.ready(async err => {
    t.error(err)

    fastify.casbin.enforce.callsFake((sub, obj, act) => {
      t.equal(sub, 'GET')
      t.equal(obj, undefined)
      t.equal(act, '/')
      return Promise.resolve(false)
    })

    await fastify.inject('/')
    fastify.close()
  })
})
