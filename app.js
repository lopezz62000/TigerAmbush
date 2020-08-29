var express = require('express');  
var app = express();  
var server = app.listen(process.env.PORT || 3000);
var io = require('socket.io')(server);
const url = require('url');
const https = require('https');
var util = require('util');
var natural = require('natural');
const querystring = require('querystring');

var appLink = process.env.APPLINK || 'http://localhost:3000/';
var AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'id50.auth0.com';
var AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID || 'tLomgRqPFuPmSJHChGsNfMvP1ckQ0avc';
var AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET || 'b2-m64pKtBmOyU_xUZRrVKLFJAsu6drtXNKRB8yb6SJsnoNYaVhgziWo07fxl9VH';
var AUTH0_CALLBACK_URL = process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/callback';


/****************
* APP AUTH0 START 
****************/

var session = require('express-session');

// config express-session
var sess = {
  secret: 'b2-m64pKtBmOyU_xUZRrVKLFJAsu6drtXNKRB8yb6SJsnoNYaVhgziWo07fxl9VH',
  cookie: {},
  resave: false,
  saveUninitialized: true
};

if (app.get('env') === 'production') {
  // Use secure cookies in production (requires SSL/TLS)
  sess.cookie.secure = true;

  // Uncomment the line below if your application is behind a proxy (like on Heroku)
  // or if you're encountering the error message:
  // "Unable to verify authorization request state"
  app.set('trust proxy', 1);
}

app.use(session(sess));

var passport = require('passport');
var Auth0Strategy = require('passport-auth0');

// Configure Passport to use Auth0
var strategy = new Auth0Strategy(
  {
    domain: AUTH0_DOMAIN,
    clientID: AUTH0_CLIENT_ID,
    clientSecret: AUTH0_CLIENT_SECRET,
    callbackURL: AUTH0_CALLBACK_URL
  },
  function (accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  }
);

passport.use(strategy);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

/**************
* APP AUTH0 END 
**************/

/********************
* APP VARIABLES START 
********************/

var serverStatus = 'alive';
var timeoutObjs = {};
var rooms = {
    'UHJpbmNldG9uIFRpZ2Vycw==': {
        'link':appLink+'chat?roomID=UHJpbmNldG9uIFRpZ2Vycw==', 
        'roomName':'Princeton Tigers',
        'password': '',
        'description': 'This is the default chat. Anyone can come join! Unlike other chats, this room will stay open even if there is no one in it.',
        'openRandomJoin': true,
        'participants': {},
        'messages': new Array(),
        'canDelete': false
    },
    'Q2xhc3Mgb2YgMjAyMQ==': {
        'link':appLink+'chat?roomID=Q2xhc3Mgb2YgMjAyMQ==', 
        'roomName':'Class of 2021',
        'password': '',
        'description': 'This is for the Class of 2021.',
        'openRandomJoin': true,
        'participants': {},
        'messages': new Array(),
        'canDelete': false
    },
    'Q2xhc3Mgb2YgMjAyMg==': {
        'link':appLink+'chat?roomID=Q2xhc3Mgb2YgMjAyMg==', 
        'roomName':'Class of 2022',
        'password': '',
        'description': 'This is for the Class of 2022.',
        'openRandomJoin': true,
        'participants': {},
        'messages': new Array(),
        'canDelete': false
    },
    'Q2xhc3Mgb2YgMjAyMw==': {
        'link':appLink+'chat?roomID=Q2xhc3Mgb2YgMjAyMw==', 
        'roomName':'Class of 2023',
        'password': '',
        'description': 'This is for the Class of 2023.',
        'openRandomJoin': true,
        'participants': {},
        'messages': new Array(),
        'canDelete': false
    },
    'Q2xhc3Mgb2YgMjAyNA==': {
        'link':appLink+'chat?roomID=Q2xhc3Mgb2YgMjAyNA==', 
        'roomName':'Class of 2024',
        'password': '',
        'description': 'This is for the Class of 2024.',
        'openRandomJoin': true,
        'participants': {},
        'messages': new Array(),
        'canDelete': false
    }, 
    'R2FwIFllYXI=': {
        'link':appLink+'chat?roomID=R2FwIFllYXI=', 
        'roomName':'Gap Years',
        'password': '',
        'description': 'This is for people in a Gap Year.',
        'openRandomJoin': true,
        'participants': {},
        'messages': new Array(),
        'canDelete': false
    },
};
var adminEmails = ['zlopez@princeton.edu', 'byw2@princeton.edu', 'singl@princeton.edu'];
var announcement = "";

var TfIdf = natural.TfIdf;
var tfidf = new TfIdf();
var tfidfRooms = [];
var tfidfIDs = ['HelloWorld', '2021', '2022', '2023', '2024', 'Gap Year'];
tfidf.addDocument(JSON.stringify(rooms['HelloWorld']));
tfidfRooms.push(JSON.stringify(rooms['HelloWorld']));
tfidf.addDocument(JSON.stringify(rooms['2021']));
tfidfRooms.push(JSON.stringify(rooms['2021']));
tfidf.addDocument(JSON.stringify(rooms['2022']));
tfidfRooms.push(JSON.stringify(rooms['2022']));
tfidf.addDocument(JSON.stringify(rooms['2023']));
tfidfRooms.push(JSON.stringify(rooms['2023']));
tfidf.addDocument(JSON.stringify(rooms['2024']));
tfidfRooms.push(JSON.stringify(rooms['2024']));
tfidf.addDocument(JSON.stringify(rooms['Gap_Year']));
tfidfRooms.push(JSON.stringify(rooms['Gap_Year']));

/******************
* APP VARIABLES END 
******************/

/*****************
* APP ROUTES START
*****************/

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/', (req, res) => {
    var userData = null;
    if(req.user) {
        const { _raw, _json, ...userProfile } = req.user;
        userData = userProfile;
    }
    res.render('rooms', {
        "appLink":appLink,
        "userData": userData
    });
});

app.get('/login', passport.authenticate('auth0', {
    scope: 'openid email profile'
  }), function (req, res) {
    res.redirect('/');
  });
  
  // Perform the final stage of authentication and redirect to previously requested URL or '/user'
app.get('/callback', function (req, res, next) {
    passport.authenticate('auth0', function (err, user, info) {
        if (err) { return next(err); }
        if (!user) { return res.redirect('/login'); }
        req.logIn(user, function (err) {
        if (err) { return next(err); }
        const returnTo = req.session.returnTo;
        delete req.session.returnTo;
        res.redirect(returnTo || '/');
        });
    })(req, res, next);
});
  
  // Perform session logout and redirect to homepage
app.get('/logout', (req, res) => {
    req.logout();

    var returnTo = req.protocol + '://' + req.hostname;
    var port = req.connection.localPort;
    if (port !== undefined && port !== 80 && port !== 443) {
        returnTo += ':' + port;
    }
    var logoutURL = new url.URL(
        util.format('https://%s/v2/logout', AUTH0_DOMAIN)
    );
    var searchString = querystring.stringify({
        client_id: AUTH0_CLIENT_ID,
        returnTo: returnTo
    });
    logoutURL.search = searchString;

    res.redirect(logoutURL);
});

app.get('/chat', (req, res) => {
    if(req.user) {
        var hasPassword = false;
        var alive = false;
        var roomName = "Closed Room"
        if(url.parse(req.url,true).query['roomID'] in rooms) {
            alive = true;
            hasPassword = (rooms[url.parse(req.url,true).query['roomID']]['password'] != "");
            roomName = rooms[url.parse(req.url,true).query['roomID']]['roomName']
        }
        const { _raw, _json, ...userProfile } = req.user;
        res.render('index', {
            "roomID": url.parse(req.url,true).query['roomID'],
            "appLink":appLink,
            "hasPassword": hasPassword,
            "alive": alive,
            "roomName": roomName,
            "announcement": announcement,
            "userData": userProfile
        });
    }
    else {
        res.redirect('/');
    }
});

app.get('/admin', (req, res) => {
    if(req.user) {
        res.render('admin', {
            'rooms': JSON.stringify(rooms), 
            "appLink":appLink, 
            "announcement": announcement
        });
    }
    else {
        req.redirect('/');
    }
});

/***************
* APP ROUTES END
***************/

/******************
* APP SOCKETS START
******************/

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        if(data['roomID'] in rooms) {
            if(data['roomID'] in timeoutObjs) {
                clearTimeout(timeoutObjs[data['roomID']]);
                delete timeoutObjs[data['roomID']];
            }
            rooms[data['roomID']]['participants'][data['userID']] = data['fullName'] + " (" + data['email'] + ")";
            io.sockets.emit('disperse'+data['roomID'], {"message": rooms[data['roomID']]['participants'][data['userID']] + " has joined the chat.", "email":"room bot", "userID": "-1"});
            io.sockets.emit('enter'+data['roomID'], rooms[data['roomID']]['participants']);
            io.sockets.emit('refreshRooms', {'rooms': rooms, 'serverStatus': serverStatus});
        }
    });

    socket.on('rename', (data) => {
        if(data['roomID'] in rooms && data['userID'] in rooms[data['roomID']]['participants']) {
            rooms[data['roomID']]['participants'][data['userID']] = data['fullName'] + " (" + data['email'] + ")";
            io.sockets.emit('enter'+data['roomID'], rooms[data['roomID']]['participants']);
        }
    });

    socket.on('validate', (data) => {
        if(data['roomID'] in rooms) {
            if(rooms[data['roomID']]['password'] == Buffer.from(data['password']).toString('base64')) {
                socket.emit('connect'+data['userID'],'success');
                return;
            }
            else {
                socket.emit('connect'+data['userID'],'Wrong password.');
                return;
            }
        }
    });

    function deleteRoom(roomID) {
        delete rooms[roomID];

        tfidf = new TfIdf();
        tfidfIDs = Object.keys(rooms);
        var i;
        for(i = 0; i < tfidfIDs.length; i++) {
            tfidf.addDocument(JSON.stringify(rooms[tfidfIDs[i]]));
            tfidfRooms.push(JSON.stringify(rooms[tfidfIDs[i]]));
        }
        io.sockets.emit('destroy'+roomID, roomID);
        io.sockets.emit('refreshRooms', {'rooms': rooms, 'serverStatus': serverStatus});
    }

    socket.on('leave', (data) => {
        var roomID = data['roomID'];
        var userID = data['userID'];
        if(roomID in rooms) {
            io.sockets.emit('disperse'+data['roomID'], {"message":rooms[roomID]['participants'][userID] + " has left the chat.", "userID":"-1", "email":"room bot"});
            if(userID in rooms[roomID]['participants']) {
                delete rooms[roomID]['participants'][userID];
            }
            io.sockets.emit('enter'+data['roomID'], rooms[data['roomID']]['participants']);
            if(Object.keys(rooms[roomID]['participants']).length == 0 && rooms[roomID]['canDelete']) {
                timeoutObjs[roomID] = setTimeout(deleteRoom, 150000, roomID);
            }
        }
        io.sockets.emit('refreshRooms', {'rooms': rooms, 'serverStatus': serverStatus});
    });

    socket.on('send', (data) => {
        if(data['roomID'] in rooms) {
            rooms[data['roomID']]['messages'].push({"message": data['message'], "email": data['email']});
            io.sockets.emit('disperse'+data['roomID'], {"message": data['message'], "email": data['email'], "userID": data["userID"]});
        }
    });

    socket.on('report', (data) => {
        if(data['roomID'] in rooms) {
            console.log(data['email']+"reported the following chat: ");
            console.log(rooms[data['roomID']]['messages']);
            io.sockets.emit('disperse'+data['roomID'], {"message": "All chat history has been reported.", "email":"room bot", "userID": "-1"});
        }
    });

    socket.on('getRooms', (userId) => {
        socket.emit(userId, {'rooms': rooms, 'serverStatus': serverStatus});
    });

    socket.on('createRoom', (data) => {
        var roomID = Buffer.from(data['roomName']).toString('base64');
        var password = "";
        if(data['password'] != "") {
            password = Buffer.from(data['password']).toString('base64');
        }
        rooms[roomID]={
            'link':appLink+'chat?roomID='+roomID,
            'interval': null,
            'roomName': data['roomName'], 
            'password': password,
            'description': data['description'],
            'openRandomJoin': data['openRandomJoin'],
            'participants': {},
            'messages': new Array(),
            'canDelete': true
        };
        tfidf.addDocument(JSON.stringify(rooms[roomID]));
        tfidfRooms.push(JSON.stringify(rooms[roomID]));
        tfidfIDs.push(roomID);
        io.sockets.emit('refreshRooms', {'rooms': rooms, 'serverStatus': serverStatus});
        timeoutObjs[roomID] = setTimeout(deleteRoom, 150000, roomID);
    });

    socket.on('search', (data) => {
        var criteria = data['criteria'];
        var userID = data['userID'];
        var res = new Array();
        tfidf.tfidfs(criteria, function(i, measure) {
            if(measure != 0) {
                res.push([tfidfRooms[i], tfidfIDs[i], measure]);
            }
        });
        res.sort(function(a, b){  
            return a[2] - b[2];
        });
        var resRooms = {}
        var i;
        for(i = 0; i < res.length; i++) {
            resRooms[res[i][1]] = rooms[res[i][1]];
        }
        socket.emit('search'+userID, {'rooms': resRooms, 'serverStatus': serverStatus});
    });

    socket.on('adminlogin', (email) => {
        if(adminEmails.indexOf(email) != -1) {
            socket.emit('adminlogin'+email,'success');
        }
        else {
            socket.emit('adminlogin'+email,'invalid');
        }
    });

    socket.on('announce', (newAnnouncement) => {
        announcement = newAnnouncement;
        io.sockets.emit('announcement', newAnnouncement);
    });

    socket.on('kill', (data) => {
        tfidf = new TfIdf();
        tfidfIDs = new Array();
        var tmpRoomsIDs = Object.keys(rooms);
        var i;
        for(i = 0; i < tmpRoomsIDs.length; i++) {
            io.sockets.emit('destroy'+tmpRoomsIDs[i], tmpRoomsIDs[i]);
        }
        rooms = {};
        serverStatus = 'dead';
        io.sockets.emit('refreshRooms', {'rooms': rooms, 'serverStatus': serverStatus});
    });
});

/****************
* APP SOCKETS END
****************/