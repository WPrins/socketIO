var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongo = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;

app.set('view engine', 'ejs');

passport.use(new Strategy({
        clientID: '274523869373933',
        clientSecret: '2b6429013eeb7335bd0ed64b3e85aaf5',
        callbackURL: 'http://localhost:3000/login/facebook/return'
    },
    function (accessToken, refreshToken, profile, cb) {
        // In this example, the user's Facebook profile is supplied as the user
        // record.  In a production-quality application, the Facebook profile should
        // be associated with a user record in the application's database, which
        // allows for account linking and authentication with other identity
        // providers.
        return cb(null, profile);
    }));

passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
});

app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({
    extended: true
}));
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
});

app.get('/', require('connect-ensure-login').ensureLoggedIn(), function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/login', function (req, res) {
    res.sendFile(__dirname + '/login.html');
});

app.get('/login/facebook',
    passport.authenticate('facebook'));

app.get('/login/facebook/return',
    passport.authenticate('facebook', {
        successReturnToOrRedirect: '/',
        failureRedirect: '/login'
    }));

app.get('/profile',
    require('connect-ensure-login').ensureLoggedIn(),
    function (req, res) {
        res.render('profile', {
            user: req.user
        });
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