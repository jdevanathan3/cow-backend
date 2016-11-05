'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.signupUser = exports.getAllUsers = exports.findUserByEmail = exports.dropUsersTable = exports.createUsersTable = exports.deleteItem = exports.editItem = exports.addItemWithId = exports.addItem = exports.getItems = exports.createItemsTable = exports.queryOnce = exports.routeQuery = exports.query = exports.routeRequest = undefined;

var _pg = require('pg');

var _pg2 = _interopRequireDefault(_pg);

var _pgPromise = require('pg-promise');

var _pgPromise2 = _interopRequireDefault(_pgPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const user = 'postgres';
const pass = 'pg-chatapp';
const serverAddr = 'localhost';
const database = 'db';
const conString = `postgres://${ user }:${ pass }@${ serverAddr }/${ database }`;

const db = (0, _pgPromise2.default)()(conString);

const routeRequest = exports.routeRequest = dbOp => (req, res) => dbOp.then(dbRes => res.send(dbRes));

const query = exports.query = (query, params) => db.any(query, params);

const routeQuery = exports.routeQuery = (query, params) => (req, res) => db.any(query, params).then(dbRes => res.send(dbRes)).catch(err => res.send({ err }));

const queryOnce = exports.queryOnce = (query, params) => db.one(query, params);

// ADD user_id foreign key to items
const createItemsTable = exports.createItemsTable = () => {
  return query(`CREATE TABLE items(
      id SERIAL PRIMARY KEY,
      text varchar(255) NOT NULL,
      date date,
      user_id integer REFERENCES users (id) ON DELETE CASCADE
    )`);
};

const getItems = exports.getItems = userId => query(`SELECT * from items WHERE user_id=${ userId }`);

const addItem = exports.addItem = ({ text, date = null, userId }) => {
  return queryOnce(`INSERT INTO items (text, date, user_id)
    VALUES ($1, $2, $3)
    RETURNING id;`, [text, date, userId]);
};

const addItemWithId = exports.addItemWithId = (id, { text, date }) => {
  return queryOnce(`INSERT INTO items (text, date)
    VALUES ('${ text }', '${ date }')
    RETURNING id;`);
};

const editItem = exports.editItem = (id, { text, date }) => {
  return queryOnce(`UPDATE items SET
      text=COALESCE($1, text),
      date=COALESCE($2, date)
    WHERE id = ${ id }
    RETURNING id;`, [text, date]);
};

const deleteItem = exports.deleteItem = id => {
  return queryOnce(`DELETE FROM items WHERE id = ${ id }
    RETURNING id;`);
};

// users

const createUsersTable = exports.createUsersTable = () => {
  return query(`CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    email varchar(255) NOT NULL UNIQUE,
    password varchar(255) NOT NULL
  );`);
};

const dropUsersTable = exports.dropUsersTable = () => query('DROP TABLE users;');

const findUserByEmail = exports.findUserByEmail = email => {
  return queryOnce(`SELECT * FROM users WHERE email = '${ email }';`);
};

const getAllUsers = exports.getAllUsers = email => query('SELECT * FROM users;');

const signupUser = exports.signupUser = ({ email, password }) => {
  return query(`INSERT INTO users (email, password)
    VALUES ('${ email }', '${ password }')`);
};