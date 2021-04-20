/// <reference types="node" />

import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import {
  ContextConfigDefault,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerBase,
  RawServerDefault
} from 'fastify/types/utils'
import { RouteGenericInterface } from 'fastify/types/route'

declare module 'fastify' {
  interface RouteShorthandOptions<
    RawServer extends RawServerBase = RawServerDefault,
    RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
    RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
    > {
    casbin?: {
      rest?: boolean | {
        getSub?: ((request: FastifyRequest<RouteGeneric, RawServer, RawRequest>) => string) | string,
        getDom?: ((request: FastifyRequest<RouteGeneric, RawServer, RawRequest>) => string) | string,
        getObj?: ((request: FastifyRequest<RouteGeneric, RawServer, RawRequest>) => string) | string,
        getAct?: ((request: FastifyRequest<RouteGeneric, RawServer, RawRequest>) => string) | string
      }
    }
  }
}

export type Hook =
  | 'onRequest'
  | 'preParsing'
  | 'preValidation'
  | 'preHandler'

export type Permission = { sub: string, dom?: string, obj: string, act: string }

export interface FastifyCasbinRestOptions {
  getSub?(request: FastifyRequest): string
  getDom?(request: FastifyRequest): string
  getObj?(request: FastifyRequest): string
  getAct?(request: FastifyRequest): string
  onDeny?(reply: FastifyReply, checkParams: Permission): void
  onAllow?(reply: FastifyReply, checkParams: Permission): void
  log?(fastify: FastifyInstance, request: FastifyRequest, checkParams: Permission ): void
  hook?: Hook
}

declare const fastifyCasbinRest: FastifyPluginAsync<FastifyCasbinRestOptions>

export default fastifyCasbinRest
