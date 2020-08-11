var express = require('express');  
var app = express();  
var server = app.listen(process.env.PORT || 3000);
var io = require('socket.io')(server);
const url = require('url');
const https = require('https');

var rooms = {'HelloWorld':{'link':'https://tigerambush.herokuapp.com/chat?roomID=HelloWorld', 'name':'Default chat', 'count': 0}};

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/', (req, res) => {
    console.log('Loaded page');
    res.render('rooms');
});

app.get('/chat', (req, res) => {
    console.log('Loaded page');
    res.render('index', {
        "roomID": url.parse(req.url,true).query['roomID']
    });
});

io.on('connection', (socket) => {
    console.log('New user connected');
    socket.on('join', (data) => {
        console.log(data);
        rooms[data['roomID']][count] = rooms[data['roomID']][count] + 1;
        io.sockets.emit('disperse'+data['roomID'], data['message']);
    });

    socket.on('send', (data) => {
        console.log(data);
        io.sockets.emit('disperse'+data['roomID'], data['message']);
    });

    socket.on('getRooms', (userId) => {
        console.log(userId);
        socket.emit(userId, {'rooms': rooms});
    });

    socket.on('createRoom', (roomName) => {
        console.log("Creating room");
        var roomID = Buffer.from(roomName).toString('base64');
        rooms[roomID]={'link':'https://tigerambush.herokuapp.com/chat?roomID='+roomID, 'name': roomName, 'count':0};
        socket.emit('refreshRooms', {'rooms': rooms});
    });

    socket.on('login',(id) => {
        var url = 'https://script.googleusercontent.com/macros/echo?user_content_key=0IiaO_XdJtXn5fTuxyt6xp22KGTU8g2QpaTKYXUJKgLb8c4jArOByg7hcyg60IHkRLvq47AAIJVjYDcaBlTJUTk6mbIYaso0m5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnA3ROvs4hZqB4_W1z5eh0X4SwQAvoh4-NlbxKyHN6ILs72o6FBT3bCde5Nn9d0yfkZ0mgLDwm9cO&lib=MUjnk6assk8FwzC2y0JM2ZfYkqy2-7K9Q';
        console.log(url);
        https.get(url, (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                console.log(data);
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    });
});