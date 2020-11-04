'use strict'

const fp = require('fastify-plugin')
const { Forbidden } = require('http-errors')

const defaultOptions = {
  getSub: request => request.user,
  getObj: request => request.url,
  getAct: request => request.method,
  onDeny: (reply, sub, obj, act) => {
    throw new Forbidden(`${sub} not allowed to ${act} ${obj}`)
  }
}

async function fastifyCasbinRest (fastify, options) {
  options = { ...defaultOptions, ...options }

  fastify.addHook('onRoute', routeOptions => {
    // add option to turn it on for all routes
    // rest value will depend on the value of that option
    // fastify-swagger for an example
    // i.e. enforceForAllRoutes
    if (routeOptions.casbin && routeOptions.casbin.rest) {
      routeOptions.preHandler = async (request, reply) => {
        const sub = options.getSub(request)
        const obj = options.getObj(request)
        const act = options.getAct(request)

        fastify.log.info({ sub, obj, act }, 'Invoking casbin enforce')

        if (!(await fastify.casbin.enforce(sub, obj, act))) {
          await options.onDeny(reply, sub, obj, act)
        }
      }
    }
  })
}

module.exports = fp(fastifyCasbinRest, {
  name: 'fastify-casbin-rest',
  decorators: {
    fastify: ['casbin']
  },
  dependencies: ['fastify-casbin']
})
