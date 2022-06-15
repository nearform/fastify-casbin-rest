const { PG_CONNECTION_STRING, CASBIN_ADAPTER, JWT_SECRET } = process.env

module.exports = async function (fastify, opts) {
  await fastify
    .register(require('fastify-jwt'), {
      secret: JWT_SECRET
    })
    .register(require('fastify-postgres'), {
      connectionString: PG_CONNECTION_STRING
    })
    .register(require('./plugins/authenticate'))
    .register(require('./plugins/casbin'), {
      connectionString: PG_CONNECTION_STRING,
      casbinAdapter: CASBIN_ADAPTER
    })
    .register(require('./routes'))
}
