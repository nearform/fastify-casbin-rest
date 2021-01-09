# fastify-casbin-rest

![Continuous Integration](https://github.com/nearform/fastify-casbin-rest/workflows/ci/badge.svg)
[![codecov](https://codecov.io/gh/nearform/fastify-casbin-rest/branch/master/graph/badge.svg?token=BwsVjvYSJb)](https://codecov.io/gh/nearform/fastify-casbin-rest)
[![npm version](https://badge.fury.io/js/fastify-casbin-rest.svg)](https://badge.fury.io/js/fastify-casbin-rest)

A plugin for [Fastify](http://fastify.io/) that adds support for [Casbin](https://casbin.org/) RESTful model.

It depends and builds on top of [fastify-casbin](https://github.com/nearform/fastify-casbin) and provides an opinionated approach to model an authorization scheme based on a RESTful model using [Casbin Node.js APIs](https://github.com/casbin/node-casbin) within a Fastify application.

## Install

```
npm i casbin fastify-casbin fastify-casbin-rest
```

> `fastify-casbin` must be registered in the Fastify instance

## How it works

Once registered, the plugin use the Fastify instance decorated by `fastify-casbin` and will automatically enforce authorization rules to routes where the plugin is enabled.

It uses the default Casbin's `sub`, `obj` and `act` entities and extracts them automatically from the request.

When a rule is not satisfied, it returns a `403 Forbidden` error by default.

All the options can be customized when registering the plugin.

## API

The plugin must be explicitly enabled on individual routes via route options. The plugin will have no effect on routes on which it is not enabled.

```js
fastify.route({
  // ... other route options
  casbin: {
    rest: true
  }
})
```

The API exposed by this plugin is the configuration options:

| Option   | Type                                                          | Description                                       | Default                         |
| -------- | ------------------------------------------------------------- | ------------------------------------------------- | ------------------------------- |
| `getSub` | `Request => string`                                           | Extracts `sub` from the request                   | `r => r.user`                   |
| `getObj` | `Request => string`                                           | Extracts `obj` from the request                   | `r => r.url`                    |
| `getAct` | `Request => string`                                           | Extracts `act` from the request                   | `r => r.method`                 |
| `onDeny` | `(Reply, sub, obj, act) => any`                               | Invoked when Casbin's `enforce` resolves to false | Returns a `403 Forbidden` error |
| `hook`   | `'onRequest' | 'preParsing' | 'preValidation' | 'preHandler'` | Which lifecycle to use for performing the check   | 'onRoute'                       |

You can also set `getSub`, `getObj` and `getAct` params inside route options. Route extraction rules take precedence over global plugin rules.

## Examples

A working example can be found in the [examples](examples) folder.

The example below uses [fastify-jwt](https://github.com/fastify/fastify-jwt) to authenticate users and extract user information from the request.
It uses sample REST [model](examples/fastify-casbin-rest-example/config/rest_model.conf) and [policy](examples/fastify-casbin-rest-example/config/rest_policy.csv) files.

```js
const fastify = require('fastify')()

// register jwt plugin
fastify.register(require('fastify-jwt'), {
  secret: 'some secret'
})

// register casbin plugin
fastify.register(require('fastify-casbin'), {
  modelPath: 'rest_model.conf', // the model configuration
  adapter: 'rest_policy.csv' // the adapter
})

// register and configure casbin-rest plugin
fastify.register(require('fastify-casbin-rest'), {
  getSub: r => r.user.payload.username
})

// decorate Fastify instance with authenticate method
fastify.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

// sample login endpoint which always authenticates the user
fastify.post('/login', async request => {
  return fastify.jwt.sign({ payload: { username: 'alice' } })
})

fastify.get(
  '/protected',
  {
    // ensure user is authenticated
    preValidation: [fastify.authenticate],
    // enable fastify-casbin-rest plugin on this route, override default "getObj" rule
    casbin: {
      rest: true,
      getObj: request => request.userId
    }
  },
  async () => `You're in!`
)
```

## License

Licensed under [MIT License](./LICENSE)
