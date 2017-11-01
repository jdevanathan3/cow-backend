CREATE TABLE users(
  id SERIAL PRIMARY KEY,
  email varchar(255) NOT NULL UNIQUE,
  password varchar(255) NOT NULL
);

CREATE TABLE items(
  id SERIAL PRIMARY KEY,
  text varchar(255) NOT NULL,
  date date,
  start_time time,
  end_time time,
  parsed_times text[],
  user_id integer REFERENCES users (id) ON DELETE CASCADE
);
