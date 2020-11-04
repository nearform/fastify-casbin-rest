const fp = require('fastify-plugin')
const { Unauthorized, NotFound } = require('http-errors')

async function routes (fastify) {
  fastify.post('/login', async request => {
    const { username, password } = request.body || {}

    if (!username || username !== password) {
      throw Unauthorized('Wrong username or password (try same value for both)')
    }

    const {
      rows: [user]
    } = await fastify.pg.query(
      `
      SELECT id, username
      FROM users
      WHERE username = $1
      `,
      [username]
    )

    if (!user) {
      throw NotFound('User does not exist')
    }

    return fastify.jwt.sign({ payload: user })
  })

  fastify.put(
    '/toggle-admin',
    {
      preValidation: [fastify.authenticate]
    },
    async request => {
      const user = request.user.payload

      const isAdmin = await fastify.casbin.hasGroupingPolicy(
        user.username,
        'admin'
      )

      if (isAdmin) {
        await fastify.casbin.removeGroupingPolicy(user.username, 'admin')
      } else {
        await fastify.casbin.addGroupingPolicy(user.username, 'admin')
      }

      return { isAdmin: !isAdmin }
    }
  )

  fastify.get(
    '/posts',
    {
      preValidation: [fastify.authenticate],
      casbin: {
        rest: true
      }
    },
    async () => {
      const { rows } = await fastify.pg.query(
        `
        SELECT posts.*, users.username
        FROM posts
        JOIN users
        ON posts.author_id = users.id
        `
      )
      return rows
    }
  )

  fastify.delete(
    '/post/:id',
    {
      preValidation: [fastify.authenticate],
      casbin: {
        rest: true
      }
    },
    async (request, reply) => {
      const {
        params: { id },
        user: { payload: user }
      } = request

      await fastify.pg.query(
        `
        DELETE FROM posts
        WHERE id = $1
        `,
        [id]
      )

      await fastify.casbin.removePolicy(
        user.username,
        `/post/${id}`,
        '(PUT)|(DELETE)'
      )

      return reply.code(204).send()
    }
  )

  fastify.put(
    '/post/:id',
    {
      preValidation: [fastify.authenticate],
      casbin: {
        rest: true
      }
    },
    async (request, reply) => {
      const { id } = request.params
      const { title, content } = request.body

      await fastify.pg.query(
        `
        UPDATE posts
        SET title = $1, content = $2
        WHERE id = $3
        `,
        [title, content, id]
      )

      return reply.code(204).send()
    }
  )

  fastify.post(
    '/posts',
    {
      preValidation: [fastify.authenticate],
      casbin: {
        rest: true
      }
    },
    async (request, reply) => {
      const user = request.user.payload
      const { title, content } = request.body

      const {
        rows: [post]
      } = await fastify.pg.query(
        `
        INSERT INTO posts (title, content, author_id)
        VALUES ($1, $2, $3)
        RETURNING id, title, content
        `,
        [title, content, user.id]
      )

      await fastify.casbin.addPolicy(
        user.username,
        `/post/${post.id}`,
        '(PUT)|(DELETE)'
      )

      return reply.code(201).send(post)
    }
  )
}

module.exports = fp(routes)
