const express = require('express'),
      app     = express(),
      http    = require('http').Server(app),
      io      = require('socket.io')(http);
      fs      = require('fs');

const port = 8080
var users = {};

console.log(__dirname);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.get('/distCalibration', (req, res) => {
  res.sendFile(__dirname + '/distCalibration.html');
});
app.get('/frmntCalibration', (req, res) => {
  res.sendFile(__dirname + '/frmntCalibration.html');
});
app.get('/broadcast', (req, res) => {
  res.sendFile(__dirname + '/broadcast.html');
});
app.use('/distanceMethod', express.static(__dirname + '/distanceMethod'));
app.use('/individualMethod', express.static(__dirname + '/individualMethod'));
app.use('/broadcastScripts', express.static(__dirname + '/broadcastScripts'));

http.listen(port, () => {
  console.log(`listening on http://localhost:${port}`);
});

io.on('connection', (socket) => {
  console.log('connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('disconnected:', socket.id);
  });

  // initialises buffer on broadcast page
  socket.on('initBuffer', function(data){
    io.emit('initMseBuf', data);
    console.log('sent start signal');
  });

  // Delays sending first segments to reduce errors with mediabuffer
  socket.on('sendFirstBlobsA', function(blobs){
    setTimeout(() => {
      io.emit('broadcastBlobsA', blobs);
    }, 800);
  });
  socket.on('sendFirstBlobsB', function(blobs){
    setTimeout(() => {
      io.emit('broadcastBlobsB', blobs);
    }, 800);
  });

  // sends segments
  socket.on('sendBlobsA', function(blobs){
    io.emit('broadcastBlobsA', blobs);
  });
  socket.on('sendBlobsB', function(blobs){
    io.emit('broadcastBlobsB', blobs);
  });

  // sends data for each speakers recognised speech array
  socket.on('speechData', function(data){
    io.emit('speakerSpeechData', data);
  })
});
