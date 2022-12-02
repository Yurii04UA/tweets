const express = require('express')

const {createServer} = require('http')
const { default: mongoose } = require('mongoose')
const { Server } = require('socket.io')
require('dotenv').config()
const bodyParser = require('body-parser')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
const server = createServer(app)

app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});
app.use('/api', require('./server/routes/api.route'))

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('twits/build'))
}

let socketConnection

io.on("connection", socket => {
    if (socketConnection === undefined) {
        socketConnection = socket
    }
    console.log('socket ', socket)
    require('./server/routes/tweets.js')(app, socketConnection)
})
io.on("disconnect", () => server.close())

mongoose
.connect(process.env.MONGO_URI)
.then((res) => console.log('db connected'))
.catch((err) => console.log(err))

server.listen(process.env.PORT, () => {
    console.log(`server is up on ${process.env.PORT}`)
})
