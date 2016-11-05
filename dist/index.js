'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _pg = require('pg');

var _pg2 = _interopRequireDefault(_pg);

var _db = require('./db.js');

var db = _interopRequireWildcard(_db);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _expressBearerToken = require('express-bearer-token');

var _expressBearerToken2 = _interopRequireDefault(_expressBearerToken);

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();
var portNum = process.env.PORT || 8888;

exports.default = app;


app.use((0, _cors2.default)({ credentials: true, origin: true }));
app.use(_bodyParser2.default.json());
app.use((0, _cookieParser2.default)());
app.use((0, _expressBearerToken2.default)());

app.get('/users', function (req, res) {
  db.getAllUsers().then(function (users) {
    return res.send(users);
  }).catch(function (err) {
    return res.send('API Error' + err);
  });
});

app.post('/users', function (req, res) {
  try {
    var _jwt$verify = _jsonwebtoken2.default.verify(req.token, 'is2gjoe'),
        email = _jwt$verify.email,
        password = _jwt$verify.password;

    var hashedPassword = _bcrypt2.default.hashSync(password, 10);
    db.signupUser({ email: email, password: hashedPassword }).then(function () {
      return res.send({ success: true });
    }).catch(function (err) {
      return res.send({ success: false, err: err });
    });
  } catch (err) {
    res.send({ success: false });
  }
});

app.post('/auth', getUserMiddleware, function (req, res) {
  res.send({ success: true });
});

app.get('/', function (req, res) {
  res.send('API is running correctly!');
});

app.get('/items', getUserMiddleware, function (req, res) {
  var id = req.user.id;

  db.getItems(id).then(function (items) {
    res.send(items);
  }).catch(function (err) {
    res.send({ err: err });
  });
});

app.post('/items', getUserMiddleware, function (req, res) {
  var id = req.user.id;
  var _req$body = req.body,
      text = _req$body.text,
      date = _req$body.date;

  console.log(id);
  db.addItem({ text: text, date: date, userId: id }).then(function (result) {
    res.send(result);
  }).catch(function (err) {
    res.send({ err: err });
  });
});

app.post('/items/:id', requireAuth, function (req, res) {
  var id = parseInt(req.params.id);
  if (Number.isInteger(id)) {
    db.addItemWithId(id, req.body).then(function (result) {
      res.send(result);
    }).catch(function (error) {
      res.send(error);
    });
  } else {
    res.send('Incorrect params');
  }
});

app.put('/items/:id', function (req, res) {
  db.editItem(req.params.id, req.body).then(function (result) {
    res.send(result);
  }).catch(function (error) {
    res.send(error);
  });
});

app.delete('/items/:id', function (req, res) {
  db.deleteItem(req.params.id).then(function (result) {
    res.send(result);
  }).catch(function (error) {
    res.send(error);
  });
});
/*
app.get('/resetItems', (req, res) => {
  db.dropItems().then(() => {
    return db.createItemsTable()
  }).then(() => {
    res.send('tables reset! remember to get this rid of this endpoint')
  }).catch((error) => {
    res.send(error)
  })
})
*/
app.listen(portNum, function () {
  if (!process.env.PORT) {
    console.log('Serving port number ' + portNum);
  }
});
/*
app.post('/query', (req, res) => {
  db.query(req.body.query).then((result) => {
    res.send(result)
  }).catch((err) => {
    res.send(err)
  })
})
*/
function requireAuth(req, res, next) {
  try {
    (function () {
      var _jwt$verify2 = _jsonwebtoken2.default.verify(req.body['cowtoken'], 'is2gjoe'),
          email = _jwt$verify2.name,
          pass = _jwt$verify2.pass;

      db.findUserByEmail(email).then(function (_ref) {
        var password = _ref.password;

        if (password === pass) {
          req.user = email;
          // TODO: only set on post
          req.body['user_email'] = email;
          return next();
        }
        return res.send({ success: false, message: 'Authentication failed' });
      }).catch(function (err) {
        res.send({ success: false, message: 'Authentication failed' });
      });
    })();
  } catch (err) {
    res.send({ success: false, message: 'Authentication failed' });
  }
}

function getUserMiddleware(req, res, next) {
  try {
    (function () {
      var _jwt$verify3 = _jsonwebtoken2.default.verify(req.token, 'is2gjoe'),
          email = _jwt$verify3.email,
          password = _jwt$verify3.password;

      db.findUserByEmail(email).then(function (user) {
        if (!_bcrypt2.default.compareSync(password, user.password)) {
          throw new Error();
        }
        req.user = user;
        return next();
      }).catch(function (err) {
        return res.send({ success: false });
      });
    })();
  } catch (err) {
    res.send({ success: false, message: 'Authentication failed' });
  }
}

// testing
/*
app.get('/createUsersTable', (req, res) => {
  db.createUsersTable().then(() => {
    res.send('yay created table');
  }).catch((err) => {
    res.send(err);
  })
})

app.get('/resetUsers', (req, res) => {
  db.dropUsersTable().then(() => {
    return db.createUsersTable()
  }).then(() => {
    res.send('yay reset tables');
  }).catch((err) => {
    res.send(err);
  })
})

app.get('/dropUsersTable', (req, res) => res.send(db.dropUsersTable()))

app.get('/createItemsTable', (req, res) => {
  db.createItemsTable()
  res.send('yay')
})
*/