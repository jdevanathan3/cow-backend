import pg from 'pg'
import pgp from 'pg-promise'

const isDevEnvironment = process.env.NODE_ENV === 'dev'

pg.defaults.ssl = !isDevEnvironment

const conString = isDevEnvironment ?
  'postgres://localhost/cow' :
  process.env.DATABASE_URL

const db = pgp()(conString)

export const routeRequest = (dbOp) =>
  (req, res) => dbOp.then((dbRes) => res.send(dbRes))

export const query = (query, params) => db.any(query, params)

export const routeQuery = (query, params) =>
  (req, res) => db.any(query, params)
    .then((dbRes) => res.send(dbRes))
    .catch((err) => res.send({ err }))

export const queryOnce = (query, params) => db.one(query, params)

export const createItemsTable = () => {
  return query(`CREATE TABLE items(
      id SERIAL PRIMARY KEY,
      text varchar(255) NOT NULL,
      date date,
      user_id integer REFERENCES users (id) ON DELETE CASCADE
    )`)
}

export const getItems = (userId) =>
  query(`SELECT * from items WHERE user_id=${userId}`)

export const addItem = ({ text, date=null , startTime=null, endTime=null, parsedTimes=[], userId}) => {
  return queryOnce(`INSERT INTO items (text, date, start_time, end_time, user_id, parsed_times)
    VALUES ($1, $2, $3, $4, $5, $6::text[])
    RETURNING id;`, [text, date, startTime, endTime, userId, parsedTimes])
}

export const addItemWithId = (id, { text, date }) => {
  return queryOnce(`INSERT INTO items (text, date)
    VALUES ('${text}', '${date}')
    RETURNING id;`)
}

export const editItem = (id, { text, date }) => {
  return queryOnce(
    `UPDATE items SET
      text=COALESCE($1, text),
      date=COALESCE($2, date)
    WHERE id = ${id}
    RETURNING id;`, [text, date])
}

export const deleteItem = (id) => {
  return queryOnce(
    `DELETE FROM items WHERE id = ${id}
    RETURNING id;`
  )
}

// users

export const createUsersTable = () => {
  return query(`CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    email varchar(255) NOT NULL UNIQUE,
    password varchar(255) NOT NULL
  );`)
}

export const dropUsersTable = () => query('DROP TABLE users;')

export const findUserByEmail = (email) => {
  return queryOnce(
    `SELECT * FROM users WHERE email = '${email}';`
  )
}

export const getAllUsers = (email) => query('SELECT * FROM users;')

export const signupUser = ({ email, password }) => {
  return query(`INSERT INTO users (email, password)
    VALUES ('${email}', '${password}')`)
}
