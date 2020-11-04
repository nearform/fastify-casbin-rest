# fastify-casbin-rest-example

This example shows how to use the fastify-casbin-rest plugin in a Node.js application.

## Setup

- `cp .env.sample .env`
- `npm i`
- `docker-compose up -d`
- `npm start`

## How it works

It uses fastify-casbin-rest and allows to use either a file system or a Postgres adapter based on the `CASBIN_ADAPTER` environment variable.

It exposes some routes that a typical RESTful application would contain:

- `POST /login` to authenticate the user
- `GET/POST /posts` to list or create a new post
- `PUT/DELETE /post/:id` to edit or delete a post
- `PUT /toggle-admin` to make the current user an admin or remove it as an admin

The data is stored in the Postgres database running in docker-compose.
The policy data is stored either on the file system or in Postgres depending on which adapter is used.

The default policies configured allow:

- anyone to access the `/login` route (the plugin is not used on this route)
- any authenticated user to list and create posts
- only admins and the post author to edit or delete a post
- any authenticated user to toggle its admin status (for demonstration purposes)

Upon startup, some sample policies and some seed data are created in the database.

## Playing around

### Login

To obtain a JWT to include in the authenticated requests:

```bash
curl --location --request POST 'http://localhost:3001/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "username": "alice",
    "password": "alice"
}'
```

Users `alice` and `bob` are created when the database is initialized. Any existing user can login using their username as username and password.

Copy the JWT token that's returned by the login route to include it in the subsequent requests.

### List posts

```bash
curl --location --request GET 'http://localhost:3001/posts' \
--header 'authorization: bearer {your token}'
}'
```

### Create a post

```bash
curl --location --request POST 'http://localhost:3001/posts' \
--header 'authorization: bearer {your token}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "title": "a new post from alice",
    "content": "some interesting content"
}'
```

### Delete a post

If you try to delete a post authored by another user you will get an error:

```bash
curl --location --request DELETE 'http://localhost:3001/post/2' \
--header 'authorization: bearer {your token}'
```

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "alice not allowed to DELETE /post/2"
}
```

### Toggle admin status

If you toggle your user's admin status you can then perform admin operations, including deleting posts authored by other users:

```bash
curl --location --request PUT 'http://localhost:3001/toggle-admin' \
--header 'authorization: bearer {your token}'
```

```json
{
  "isAdmin": true
}
```
