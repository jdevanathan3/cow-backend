import express from 'express'
import pg from 'pg'
import * as db from './db.js'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import tokenAuth from 'express-bearer-token'
import bcrypt from 'bcrypt'

const app = express()
const portNum = process.env.PORT || 8888

export default app

app.use(cors({ credentials: true, origin: true }))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(tokenAuth())

app.get('/users', (req, res) => {
  db.getAllUsers().then((users) => {
    return res.send(users)
  }).catch((err) => {
    return res.send('API Error' + err)
  })
})

app.post('/users', (req, res) => {
  try {
    const { email, password } = jwt.verify(
      req.token, 'is2gjoe')
    const hashedPassword = bcrypt.hashSync(password, 10)
    db.signupUser({ email, password: hashedPassword })
      .then(() => res.send({ success: true }))
      .catch((err) => res.send({ success: false, err }))
  } catch (err) {
    res.send({ success: false })
  }
})

app.post('/auth', getUserMiddleware, (req, res) => {
  res.send({ success: true })
})

app.get('/', (req, res) => {
  res.send('API is running correctly!')
})

app.get('/items', getUserMiddleware, (req, res) => {
  const { id } = req.user
  db.getItems(id).then((items) => {
    res.send(items)
  }).catch((err) => {
    res.send({ err })
  })
})

app.post('/items', getUserMiddleware, (req, res) => {
  const { id } = req.user
  const { text, date } = req.body
  console.log(id)
  db.addItem({ text, date, userId: id })
    .then((result) => {
      res.send(result)
    })
    .catch((err) => {
      res.send({ err })
    })
})

app.post('/items/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id)
  if (Number.isInteger(id)) {
    db.addItemWithId(id, req.body)
    .then((result) => {
      res.send(result)
    })
    .catch((error) => {
      res.send(error)
    })
  } else {
    res.send('Incorrect params')
  }
})

app.put('/items/:id', (req, res) => {
  db.editItem(req.params.id, req.body)
    .then((result) => {
      res.send(result)
    })
    .catch((error) => {
      res.send(error)
    })
})

app.delete('/items/:id', (req, res) => {
  db.deleteItem(req.params.id)
    .then((result) => {
      res.send(result)
    })
    .catch((error) => {
      res.send(error)
    })
})
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
    console.log(`Serving port number ${portNum}`)
  }
})
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
    const { name: email, pass } = jwt.verify(
      req.body['cowtoken'], 'is2gjoe')
    db.findUserByEmail(email).then(({ password }) => {
      if (password === pass) {
        req.user = email
        // TODO: only set on post
        req.body['user_email'] = email
        return next()
      }
      return res.send({ success: false, message: 'Authentication failed' })
    }).catch((err) => {
      res.send({ success: false, message: 'Authentication failed' })
    })
  } catch(err) {
    res.send({ success: false, message: 'Authentication failed' })
  }
}

function getUserMiddleware(req, res, next) {
  try {
    const { email, password } = jwt.verify(
      req.token, 'is2gjoe')
    db.findUserByEmail(email)
      .then((user) => {
        if (!bcrypt.compareSync(password, user.password)) {
          throw new Error()
        }
        req.user = user
        return next()
      })
      .catch((err) =>
        res.send({ success: false }))
  } catch(err) {
    res.send({ success: false, message: 'Authentication failed' })
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
