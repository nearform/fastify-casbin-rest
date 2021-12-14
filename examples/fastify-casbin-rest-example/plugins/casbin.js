const { join } = require('path')
const fp = require('fastify-plugin')

const { newAdapter } = require('casbin-pg-adapter').default
const { newWatcher } = require('casbin-pg-watcher')

async function getCasbinAdapterOptions (casbinAdapter, connectionString) {
  switch (casbinAdapter) {
    case 'pg': {
      const pgOptions = {
        connectionString,
        migrate: true
      }

      return {
        adapter: await newAdapter(pgOptions),
        watcher: await newWatcher(pgOptions)
      }
    }
    case 'file':
    default:
      return {
        adapter: join(configDir, 'rest_policy.csv')
      }
  }
}
const configDir = join(__dirname, '../config')

module.exports = fp(async function (
  fastify,
  { connectionString, casbinAdapter }
) {
  await fastify.register(require('fastify-casbin'), {
    model: join(configDir, 'rest_model.conf'),
    ...(await getCasbinAdapterOptions(casbinAdapter, connectionString))
  })

  await fastify.register(require('../../../'), {
    getSub: r => r.user.payload.username
  })

  // create some default policies in the db
  if (casbinAdapter === 'pg') {
    // any user can get or post posts
    await fastify.casbin.addPolicy('*', '/posts', '(GET)|(POST)')
    // admins can delete and update any posts
    await fastify.casbin.addPolicy('admin', '/post/*', '(DELETE)|(PUT)')
  }
})
