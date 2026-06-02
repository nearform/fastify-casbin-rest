import fastify, { FastifyReply, FastifyRequest, RequestGenericInterface } from 'fastify'
import type { RouteOptions } from 'fastify/types/route'
import { expect } from 'tstyche'
import casbinRest from './index.js'

const server = fastify()

server.register(casbinRest)

server.register(casbinRest, {
  log: (fastify, request, { sub, obj, act }) => { fastify.log.info({ sub, obj, act }, 'Invoking casbin enforce') },
  onAllow: (reply, { sub, obj, act }) => {
    expect(reply).type.toBe<FastifyReply>()
    expect(sub).type.toBe<string>()
    expect(obj).type.toBe<string>()
    expect(act).type.toBe<string>()
  },
  onDeny: (reply, { sub, obj, act }) => {
    expect(reply).type.toBe<FastifyReply>()
    expect(sub).type.toBe<string>()
    expect(obj).type.toBe<string>()
    expect(act).type.toBe<string>()
  },
  getSub: (request) => {
    expect(request).type.toBe<FastifyRequest>()
    return ''
  },
  getObj: (request) => {
    expect(request).type.toBe<FastifyRequest>()
    return ''
  },
  getAct: (request) => {
    expect(request).type.toBe<FastifyRequest>()
    return ''
  },
  getDom: (request) => {
    expect(request).type.toBe<FastifyRequest>()
    return ''
  }
})

server.get('/', {
  casbin: {
    rest: {
      getDom: (request) => 'users',
      getSub: (request) => '1',
      getObj: (request) => request.url,
      getAct: (request) => request.method
    }
  }
}, () => Promise.resolve('ok'))

server.get('/entity', {
  casbin: {
    rest: {
      getDom: 'users',
      getSub: '1',
      getObj: 'entity',
      getAct: 'read'
    }
  }
}, () => Promise.resolve('ok'))


interface ListRequest extends RequestGenericInterface {
  Params: {
    listID: string
  }
}

server.get<ListRequest>('/', {
  casbin: {
    rest: {
      getObj: (request) => request.params.listID,
    }
  }
}, () => Promise.resolve('ok'))

const route: RouteOptions = {
  method: 'GET',
  url: '/',
  handler: async () => {
  },
  casbin: {
    rest: {
      getSub: '1',
      getObj: 'entity',
      getAct: 'read'
    }
  }
}
server.route(route)
