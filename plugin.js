'use strict'

const fp = require('fastify-plugin')
const { Forbidden } = require('http-errors')

const defaultOptions = {
  getSub: request => request.user,
  getObj: request => request.url,
  getAct: request => request.method,
  onDeny: (reply, sub, obj, act, dom) => {
    throw new Forbidden(`${sub} not allowed to ${act} ${dom ? dom + ' ' : ''}${obj}`)
  },
  log: (fastify, request, sub, obj, act, dom) => { fastify.log.info({ sub, dom, obj, act }, 'Invoking casbin enforce') },
  hook: 'preHandler'
}

async function fastifyCasbinRest (fastify, options) {
  options = { ...defaultOptions, ...options }
  const { log } = options

  fastify.addHook('onRoute', routeOptions => {
    // add option to turn it on for all routes
    // rest value will depend on the value of that option
    // fastify-swagger for an example
    // i.e. enforceForAllRoutes
    if (routeOptions.casbin && routeOptions.casbin.rest) {
      const { hook } = options
      if (!routeOptions[hook]) {
        routeOptions[hook] = []
      }
      if (!Array.isArray(routeOptions[hook])) {
        routeOptions[hook] = [routeOptions[hook]]
      }

      const getSub = resolveParameterExtractor(routeOptions.casbin.rest.getSub, options.getSub)
      const getObj = resolveParameterExtractor(routeOptions.casbin.rest.getObj, options.getObj)
      const getAct = resolveParameterExtractor(routeOptions.casbin.rest.getAct, options.getAct)
      const getDom = resolveParameterExtractor(routeOptions.casbin.rest.getDom, options.getDom)

      routeOptions[hook].push(async (request, reply) => {
        const sub = getSub(request)
        const obj = getObj(request)
        const act = getAct(request)
        const dom = getDom ? getDom(request) : undefined

        log(fastify, request, sub, obj, act, dom)
        const isAuthorized = getDom ? await fastify.casbin.enforce(sub, dom, obj, act) : await fastify.casbin.enforce(sub, obj, act)

        if (!isAuthorized) {
          await options.onDeny(reply, sub, obj, act, dom)
        }
      })
    }
  })
}

function isString (value) {
  return typeof value === 'string'
}

function resolveParameterExtractor (routeOption, pluginOption) {
  if (routeOption) {
    if (isString(routeOption)) {
      return () => routeOption
    }
    return routeOption
  }
  return pluginOption
}

module.exports = fp(fastifyCasbinRest, {
  name: 'fastify-casbin-rest',
  decorators: {
    fastify: ['casbin']
  },
  dependencies: ['fastify-casbin']
})
