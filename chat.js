function connect() {
    var socket = io.connect('https://tigerambush.herokuapp.com/');
    socket.on('connect', function(data) {
        socket.emit('join', 'Hello World from client');
    });
}