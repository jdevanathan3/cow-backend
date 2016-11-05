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

const app = (0, _express2.default)();
const portNum = process.env.PORT || 8888;

exports.default = app;


app.use((0, _cors2.default)({ credentials: true, origin: true }));
app.use(_bodyParser2.default.json());
app.use((0, _cookieParser2.default)());
app.use((0, _expressBearerToken2.default)());

app.get('/users', (req, res) => {
  db.getAllUsers().then(users => {
    return res.send(users);
  }).catch(err => {
    return res.send('API Error' + err);
  });
});

app.post('/users', (req, res) => {
  try {
    const { email, password } = _jsonwebtoken2.default.verify(req.token, 'is2gjoe');
    const hashedPassword = _bcrypt2.default.hashSync(password, 10);
    db.signupUser({ email, password: hashedPassword }).then(() => res.send({ success: true })).catch(err => res.send({ success: false, err }));
  } catch (err) {
    res.send({ success: false });
  }
});

app.post('/auth', getUserMiddleware, (req, res) => {
  res.send({ success: true });
});

app.get('/', (req, res) => {
  res.send('API is running correctly!');
});

app.get('/items', getUserMiddleware, (req, res) => {
  const { id } = req.user;
  db.getItems(id).then(items => {
    res.send(items);
  }).catch(err => {
    res.send({ err });
  });
});

app.post('/items', getUserMiddleware, (req, res) => {
  const { id } = req.user;
  const { text, date } = req.body;
  console.log(id);
  db.addItem({ text, date, userId: id }).then(result => {
    res.send(result);
  }).catch(err => {
    res.send({ err });
  });
});

app.post('/items/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  if (Number.isInteger(id)) {
    db.addItemWithId(id, req.body).then(result => {
      res.send(result);
    }).catch(error => {
      res.send(error);
    });
  } else {
    res.send('Incorrect params');
  }
});

app.put('/items/:id', (req, res) => {
  db.editItem(req.params.id, req.body).then(result => {
    res.send(result);
  }).catch(error => {
    res.send(error);
  });
});

app.delete('/items/:id', (req, res) => {
  db.deleteItem(req.params.id).then(result => {
    res.send(result);
  }).catch(error => {
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
app.listen(portNum, () => {
  if (!process.env.PORT) {
    console.log(`Serving port number ${ portNum }`);
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
    const { name: email, pass } = _jsonwebtoken2.default.verify(req.body['cowtoken'], 'is2gjoe');
    db.findUserByEmail(email).then(({ password }) => {
      if (password === pass) {
        req.user = email;
        // TODO: only set on post
        req.body['user_email'] = email;
        return next();
      }
      return res.send({ success: false, message: 'Authentication failed' });
    }).catch(err => {
      res.send({ success: false, message: 'Authentication failed' });
    });
  } catch (err) {
    res.send({ success: false, message: 'Authentication failed' });
  }
}

function getUserMiddleware(req, res, next) {
  try {
    const { email, password } = _jsonwebtoken2.default.verify(req.token, 'is2gjoe');
    db.findUserByEmail(email).then(user => {
      if (!_bcrypt2.default.compareSync(password, user.password)) {
        throw new Error();
      }
      req.user = user;
      return next();
    }).catch(err => res.send({ success: false }));
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