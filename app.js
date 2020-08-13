var express = require('express');  
var app = express();  
var server = app.listen(process.env.PORT || 3000);
var io = require('socket.io')(server);
const url = require('url');
const https = require('https');
var natural = require('natural');

var appLink = process.env.APPLINK || 'http://localhost:3000/';

var rooms = {'HelloWorld': {
    'link':appLink+'chat?roomID=HelloWorld', 
    'roomName':'Default Chat', 
    'count': 0, 
    'interval': -1,
    'password': '',
    'description': 'Chat will not be deleted when people leave.',
    'openRandomJoin': true,
    'participants': {}
}};

var TfIdf = natural.TfIdf;
var tfidf = new TfIdf();
var tfidfRooms = [];
var tfidfIDs = ['HelloWorld'];
tfidf.addDocument(JSON.stringify(rooms['HelloWorld']));
tfidfRooms.push(JSON.stringify(rooms['HelloWorld']));

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('rooms', {
        "appLink":appLink
    });
});

app.get('/chat', (req, res) => {
    var hasPassword = false;
    var alive = false;
    var roomName = "Closed Room"
    if(url.parse(req.url,true).query['roomID'] in rooms) {
        alive = true;
        hasPassword = (rooms[url.parse(req.url,true).query['roomID']]['password'] != "");
        roomName = rooms[url.parse(req.url,true).query['roomID']]['roomName']
    }
    res.render('index', {
        "roomID": url.parse(req.url,true).query['roomID'],
        "userID": url.parse(req.url,true).query['userID'],
        "fullName": url.parse(req.url,true).query['fullName'],
        "email": url.parse(req.url,true).query['email'],
        "appLink":appLink,
        "hasPassword": hasPassword,
        "alive": alive,
        "roomName": roomName
    });
});

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        /*
        if(rooms[data['roomID']]['count'] == 0 && rooms[data['roomID']]['interval'] != -1) {
            clearInterval(rooms[roomID]['interval']);
        }*/
        rooms[data['roomID']]['count'] = rooms[data['roomID']]['count'] + 1;
        rooms[data['roomID']]['participants'][data['userID']] = data['fullName'] + " (" + data['email'] + ")";
        io.sockets.emit('enter'+data['roomID'], rooms[data['roomID']]['participants']);
    });

    socket.on('rename', (data) => {
        rooms[data['roomID']]['participants'][data['userID']] = data['fullName'] + " (" + data['email'] + ")";
        io.sockets.emit('enter'+data['roomID'], rooms[data['roomID']]['participants']);
    });

    socket.on('validate', (data) => {
        if(rooms[data['roomID']]['password'] == Buffer.from(data['password']).toString('base64')) {
            socket.emit('connect'+data['userID'],'success');
        }
        else {
            socket.emit('connect'+data['userID'],'Wrong password.');
        }
    });

    socket.on('leave', (data) => {
        var roomID = data['roomID'];
        var userID = data['userID'];
        if(roomID in rooms) {
            rooms[roomID]['count'] = rooms[roomID]['count'] - 1;
            delete rooms[roomID]['participants'][userID];
            io.sockets.emit('enter'+data['roomID'], rooms[data['roomID']]['participants']);
            if(rooms[roomID]['count'] == 0 && roomID != "HelloWorld") {
                delete rooms[roomID];

                tfidf = new TfIdf();
                tfidfIDs = Object.keys(rooms);
                var i;
                for(i = 0; i < tfidfIDs.length; i++) {
                    tfidf.addDocument(JSON.stringify(rooms[tfidfIDs[i]]));
                    tfidfRooms.push(JSON.stringify(rooms[tfidfIDs[i]]));
                }

                io.sockets.emit('destroy'+roomID, roomID);
                io.sockets.emit('refreshRooms', rooms);
                /*
                rooms[roomID]['interval'] = setInterval(function(){
                    delete rooms[roomID];
                    io.sockets.emit('refreshRooms', rooms);
                    console.log("Removed room "+roomID);
                },30000);*/
            }
        }
    });

    socket.on('send', (data) => {
        io.sockets.emit('disperse'+data['roomID'], data['message']);
    });

    socket.on('getRooms', (userId) => {
        socket.emit(userId, rooms);
    });

    socket.on('createRoom', (data) => {
        var roomID = Buffer.from(data['roomName']).toString('base64');
        var password = "";
        if(data['password'] != "") {
            password = Buffer.from(data['password']).toString('base64');
        }
        rooms[roomID]={
            'link':appLink+'chat?roomID='+roomID, 
            'count': 0, 
            'interval': -1,
            'roomName': data['roomName'], 
            'password': password,
            'description': data['description'],
            'openRandomJoin': data['openRandomJoin'],
            'participants': {}
        };
        tfidf.addDocument(JSON.stringify(rooms[roomID]));
        tfidfRooms.push(JSON.stringify(rooms[roomID]));
        tfidfIDs.push(roomID);
        io.sockets.emit('refreshRooms', rooms);
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
            resRooms[res[i][1]] = JSON.parse(res[i][0]);
        }
        socket.emit('search'+userID, resRooms);
    });

    socket.on('console', (message) => {
        console.log(message);
    });
});