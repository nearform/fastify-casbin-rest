import fastify, { FastifyReply, FastifyRequest } from 'fastify'
import { expectType } from 'tsd'
import casbinRest from '../plugin'

const server = fastify()

server.register(casbinRest)

server.register(casbinRest, {
  onDeny: (reply, sub, obj, act) => {
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
  }
})

server.get('/', {
  casbin: {
    rest: {
      getSub: (request: FastifyRequest) => '1',
      getObj: (request: FastifyRequest) => request.url,
      getAct: (request: FastifyRequest) => request.method
    }
  }
}, () => Promise.resolve('ok'))

server.get('/entity', {
  casbin: {
    rest: {
      getSub: '1',
      getObj: 'entity',
      getAct: 'read'
    }
  }
}, () => Promise.resolve('ok'))
