var express = require('express');  
var app = express();  
var server = app.listen(process.env.PORT || 3000);
var io = require('socket.io')(server);
const url = require('url');
const https = require('https');

var rooms = {'HelloWorld':{'link':'https://tigerambush.herokuapp.com/chat?roomID=HelloWorld', 'name':'Default chat', 'count': 0, 'interval': -1}};

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('rooms');
});

app.get('/chat', (req, res) => {
    res.render('index', {
        "roomID": url.parse(req.url,true).query['roomID'],
        "givenName": url.parse(req.url,true).query['givenName']
    });
});

app.get('/login', (req, res) => {
    res.render('login');
});

io.on('connection', (socket) => {
    console.log('New user connected');

    socket.on('join', (data) => {
        /*
        if(rooms[data['roomID']]['count'] == 0 && rooms[data['roomID']]['interval'] != -1) {
            clearInterval(rooms[roomID]['interval']);
        }*/
        rooms[data['roomID']]['count'] = rooms[data['roomID']]['count'] + 1;
        io.sockets.emit('disperse'+data['roomID'], data['message']);
    });

    socket.on('leave', (roomID) => {
        rooms[roomID]['count'] = rooms[roomID]['count'] - 1;
        if(rooms[roomID]['count'] == 0 && roomID != "HelloWorld") {
            delete rooms[roomID];
            /*
            rooms[roomID]['interval'] = setInterval(function(){
                delete rooms[roomID];
                io.sockets.emit('refreshRooms', rooms);
                console.log("Removed room "+roomID);
            },30000);*/
        }
    });

    socket.on('send', (data) => {
        io.sockets.emit('disperse'+data['roomID'], data['message']);
    });

    socket.on('getRooms', (userId) => {
        socket.emit(userId, rooms);
    });

    socket.on('createRoom', (roomName) => {
        var roomID = Buffer.from(roomName).toString('base64');
        rooms[roomID]={'link':'https://tigerambush.herokuapp.com/chat?roomID='+roomID, 'name': roomName, 'count':0, 'interval': -1};
        socket.emit('refreshRooms', rooms);
    });

    socket.on('console', (message) => {
        console.log(message);
    });
});