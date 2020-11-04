const fp = require('fastify-plugin')

module.exports = fp(async function (fastify, opts) {
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })
})
