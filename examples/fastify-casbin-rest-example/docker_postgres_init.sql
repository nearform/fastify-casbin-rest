CREATE TABLE users(id SERIAL PRIMARY KEY, username VARCHAR (50) NOT NULL);

CREATE TABLE posts(
  id serial PRIMARY KEY,
  title VARCHAR (50) NOT NULL,
  content TEXT NOT NULL,
  author_id INT REFERENCES users
);

INSERT INTO users (username) VALUES ('alice'), ('bob');
INSERT INTO posts(title, content, author_id) VALUES
  ('article from alice', 'here is an article from alice', 1),
  ('article from bob', 'here is an article from bob', 2);
