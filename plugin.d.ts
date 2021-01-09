/// <reference types="node" />

import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'

export type Hook =
  | 'onRequest'
  | 'preParsing'
  | 'preValidation'
  | 'preHandler'

export interface FastifyCasbinRestOptions {
  getSub?(request: FastifyRequest): string
  getObj?(request: FastifyRequest): string
  getAct?(request: FastifyRequest): string
  onDeny?(reply: FastifyReply, sub: string, obj: string, act: string): void
  hook?: Hook
}

declare const fastifyCasbinRest: FastifyPluginAsync<FastifyCasbinRestOptions>

export default fastifyCasbinRest
