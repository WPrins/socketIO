var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongo = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

function mongoFind() {
    mongo.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("socketChat");
        dbo.collection("chats").find({}).forEach(function (result) {
            console.log(result);
            io.emit('chat message', result.message);
            db.close();
        });
    });
}

function mongoInsert(msg) {
    mongo.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("socketChat");
        dbo.collection("chats").insertOne(msg, function (err, res) {
            console.log("1 document inserted");
            db.close();
        });
    });
}

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.emit('clear');
    mongoFind();
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    socket.on('chat message', function (msg) {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
        var obj = {
            message: msg
        };
        mongoInsert(obj);
    });
});

http.listen(3000, function () {
    console.log('listening on *.3000');
});