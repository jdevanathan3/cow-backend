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

var isDevEnvironment = process.env.NODE_ENV === 'dev';

_pg2.default.defaults.ssl = !isDevEnvironment;

var conString = isDevEnvironment ? 'postgres://postgres:pg-chatapp@localhost/db' : process.env.DATABASE_URL;

var db = (0, _pgPromise2.default)()(conString);

var routeRequest = exports.routeRequest = function routeRequest(dbOp) {
  return function (req, res) {
    return dbOp.then(function (dbRes) {
      return res.send(dbRes);
    });
  };
};

var query = exports.query = function query(_query, params) {
  return db.any(_query, params);
};

var routeQuery = exports.routeQuery = function routeQuery(query, params) {
  return function (req, res) {
    return db.any(query, params).then(function (dbRes) {
      return res.send(dbRes);
    }).catch(function (err) {
      return res.send({ err: err });
    });
  };
};

var queryOnce = exports.queryOnce = function queryOnce(query, params) {
  return db.one(query, params);
};

// ADD user_id foreign key to items
var createItemsTable = exports.createItemsTable = function createItemsTable() {
  return query('CREATE TABLE items(\n      id SERIAL PRIMARY KEY,\n      text varchar(255) NOT NULL,\n      date date,\n      user_id integer REFERENCES users (id) ON DELETE CASCADE\n    )');
};

var getItems = exports.getItems = function getItems(userId) {
  return query('SELECT * from items WHERE user_id=' + userId);
};

var addItem = exports.addItem = function addItem(_ref) {
  var text = _ref.text,
      _ref$date = _ref.date,
      date = _ref$date === undefined ? null : _ref$date,
      userId = _ref.userId;

  return queryOnce('INSERT INTO items (text, date, user_id)\n    VALUES ($1, $2, $3)\n    RETURNING id;', [text, date, userId]);
};

var addItemWithId = exports.addItemWithId = function addItemWithId(id, _ref2) {
  var text = _ref2.text,
      date = _ref2.date;

  return queryOnce('INSERT INTO items (text, date)\n    VALUES (\'' + text + '\', \'' + date + '\')\n    RETURNING id;');
};

var editItem = exports.editItem = function editItem(id, _ref3) {
  var text = _ref3.text,
      date = _ref3.date;

  return queryOnce('UPDATE items SET\n      text=COALESCE($1, text),\n      date=COALESCE($2, date)\n    WHERE id = ' + id + '\n    RETURNING id;', [text, date]);
};

var deleteItem = exports.deleteItem = function deleteItem(id) {
  return queryOnce('DELETE FROM items WHERE id = ' + id + '\n    RETURNING id;');
};

// users

var createUsersTable = exports.createUsersTable = function createUsersTable() {
  return query('CREATE TABLE users(\n    id SERIAL PRIMARY KEY,\n    email varchar(255) NOT NULL UNIQUE,\n    password varchar(255) NOT NULL\n  );');
};

var dropUsersTable = exports.dropUsersTable = function dropUsersTable() {
  return query('DROP TABLE users;');
};

var findUserByEmail = exports.findUserByEmail = function findUserByEmail(email) {
  return queryOnce('SELECT * FROM users WHERE email = \'' + email + '\';');
};

var getAllUsers = exports.getAllUsers = function getAllUsers(email) {
  return query('SELECT * FROM users;');
};

var signupUser = exports.signupUser = function signupUser(_ref4) {
  var email = _ref4.email,
      password = _ref4.password;

  return query('INSERT INTO users (email, password)\n    VALUES (\'' + email + '\', \'' + password + '\')');
};