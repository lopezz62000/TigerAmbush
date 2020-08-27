var express = require('express');  
var app = express();  
var server = app.listen(process.env.PORT || 3000);
var io = require('socket.io')(server);
const url = require('url');
const https = require('https');
var natural = require('natural');

var appLink = process.env.APPLINK || 'http://localhost:3000/';

var rooms = {
    'HelloWorld': {
    'link':appLink+'chat?roomID=HelloWorld', 
    'roomName':'Princeton Tigers', 
    'count': 0, 
    'interval': -1,
    'password': '',
    'description': 'This is the default chat. Anyone can come join! Unlike other chats, this room will stay open even if there is no one in it.',
    'openRandomJoin': true,
    'participants': {},
    'messages': new Array()
    }, 
    '2021': {
        'link':appLink+'chat?roomID=2021', 
        'roomName':'Class of 2021', 
        'count': 0, 
        'interval': -1,
        'password': '',
        'description': 'This is for the Class of 2021.',
        'openRandomJoin': true,
        'participants': {},
        'messages': new Array()
    },
    '2022': {
        'link':appLink+'chat?roomID=2022', 
        'roomName':'Class of 2022', 
        'count': 0, 
        'interval': -1,
        'password': '',
        'description': 'This is for the Class of 2022.',
        'openRandomJoin': true,
        'participants': {},
        'messages': new Array()
    },
    '2023': {
        'link':appLink+'chat?roomID=2023', 
        'roomName':'Class of 2023', 
        'count': 0, 
        'interval': -1,
        'password': '',
        'description': 'This is for the Class of 2023.',
        'openRandomJoin': true,
        'participants': {},
        'messages': new Array()
    },
    '2024': {
    'link':appLink+'chat?roomID=2024', 
    'roomName':'Class of 2024', 
    'count': 0, 
    'interval': -1,
    'password': '',
    'description': 'This is for the Class of 2024.',
    'openRandomJoin': true,
    'participants': {},
    'messages': new Array()
}, 'Gap Year': {
    'link':appLink+'chat?roomID=Gap_Year', 
    'roomName':'Gap Years', 
    'count': 0, 
    'interval': -1,
    'password': '',
    'description': 'This is for people in a Gap Year.',
    'openRandomJoin': true,
    'participants': {},
    'messages': new Array()
}
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
tfidf.addDocument(JSON.stringify(rooms['Gap Year']));
tfidfRooms.push(JSON.stringify(rooms['Gap Year']));

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
        "appLink":appLink,
        "hasPassword": hasPassword,
        "alive": alive,
        "roomName": roomName,
        "announcement": announcement
    });
});

app.get('/admin', (req, res) => {
    res.render('admin', {
        'rooms': JSON.stringify(rooms), 
        "appLink":appLink, 
        "announcement": announcement
    });
});

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        if(data['roomID'] in rooms) {
            rooms[data['roomID']]['count'] = rooms[data['roomID']]['count'] + 1;
            rooms[data['roomID']]['participants'][data['userID']] = data['fullName'] + " (" + data['email'] + ")";
            io.sockets.emit('disperse'+data['roomID'], {"message": rooms[data['roomID']]['participants'][data['userID']] + " has joined the chat.", "email":"room bot", "userID": "-1"});
            io.sockets.emit('enter'+data['roomID'], rooms[data['roomID']]['participants']);
            io.sockets.emit('refreshRooms', rooms);
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

    socket.on('leave', (data) => {
        var roomID = data['roomID'];
        var userID = data['userID'];
        if(roomID in rooms) {
            rooms[roomID]['count'] = rooms[roomID]['count'] - 1;
            io.sockets.emit('disperse'+data['roomID'], {"message":rooms[roomID]['participants'][userID] + " has left the chat.", "userID":"-1", "email":"room bot"});
            delete rooms[roomID]['participants'][userID];
            io.sockets.emit('enter'+data['roomID'], rooms[data['roomID']]['participants']);
            if(rooms[roomID]['count'] == 0 && roomID != "HelloWorld" && roomID != "2023" && roomID != "2024"&& roomID != "2021" && roomID != "2022" && roomID != "Gap Year") {
                delete rooms[roomID];

                tfidf = new TfIdf();
                tfidfIDs = Object.keys(rooms);
                var i;
                for(i = 0; i < tfidfIDs.length; i++) {
                    tfidf.addDocument(JSON.stringify(rooms[tfidfIDs[i]]));
                    tfidfRooms.push(JSON.stringify(rooms[tfidfIDs[i]]));
                }
                io.sockets.emit('destroy'+roomID, roomID);
            }
        }
        io.sockets.emit('refreshRooms', rooms);
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
            'participants': {},
            'messages': new Array()
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
});