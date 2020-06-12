const express = require('express')
const path = require('path')
// const request = require('request')

const HOST = 'localhost'
const PORT = 8000

const app = express()

function error(res, body, status, type) {
  status = status || 500
  type = type || 'text/plain'

  res.statusCode = status
  res.setHeader('Content-Type', type)
  res.end(body)
}

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.get('/static/:id', (req, res) => {
  if (!req.params.id) {
    error(res, null, 404)
  }

  const filename = req.params.id
  const file = path.join(__dirname, '../static', filename)

  if (filename.endsWith('.js') || filename.endsWith('.mjs')) {
    res.header('Content-Type', 'text/javascript')
  } else if (filename.endsWith('.json')) {
    res.header('Content-Type', 'application/json')
  }

  res.sendFile(file)
})

app.options('*', (req, res) => {
  res.end()
})

app.listen(PORT, () => {
  console.log('server started; listening on %s at %s', HOST, PORT)
})
