import fastify, { FastifyReply, FastifyRequest, RequestGenericInterface } from 'fastify'
import type { RouteOptions } from 'fastify/types/route'
import { expectType } from 'tsd'
import casbinRest from '../plugin'

const server = fastify()

server.register(casbinRest)

server.register(casbinRest, {
  log: (fastify, request, { sub, obj, act }) => { fastify.log.info({ sub, obj, act }, 'Invoking casbin enforce') },
  onDeny: (reply, { sub, obj, act }) => {
    expectType<FastifyReply>(reply)
    expectType<string>(sub)
    expectType<string>(obj)
    expectType<string>(act)
  },
  getSub: request => {
    expectType<FastifyRequest>(request)
    return ''
  },
  getObj: request => {
    expectType<FastifyRequest>(request)
    return ''
  },
  getAct: request => {
    expectType<FastifyRequest>(request)
    return ''
  },
  getDom: request => {
    expectType<FastifyRequest>(request)
    return ''
  }
})

server.get('/', {
  casbin: {
    rest: {
      getDom: (request: FastifyRequest) => 'users',
      getSub: (request: FastifyRequest) => '1',
      getObj: (request: FastifyRequest) => request.url,
      getAct: (request: FastifyRequest) => request.method
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
