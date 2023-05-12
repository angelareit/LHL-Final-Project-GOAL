const PORT = 8080;

const express = require('express');
const { connect } = require('http2');
const morgan = require('morgan');
const { userInfo } = require('os');

const app = express();

http = require('http');
server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

//Add any middleware here

app.use(morgan('dev'));

app.get('/', (req, res) => {
  return res.json({ greetings: "Universe" });
});

const users = [];
let connection = [];

// https://socket.io/docs/v3/emit-cheatsheet/

io.on('connection', socket => {
  //Create an object with userID and socketID to keep track of currently online users
  const client = { user: socket.handshake.auth.user, id: socket.id };
  users.push(client);

  //The following connection related conditions are placeholder to keep track of most recent logins, they'll be replaced with matching buddies
  connection.push({ ...client });

  if (connection.length > 2) {
    connection.shift();
  }
  
  if (connection.length === 2) {
    connection[0].buddy = connection[1].user;
    connection[1].buddy = connection[0].user;

    socket.to(connection[0].id).emit('BUDDY_ONLINE', true);
    socket.emit('BUDDY_ONLINE', true);
    
    console.log("Connection:", connection);
  }
  
  socket.on('MESSAGE_SEND', payload => {
    if(connection.length !== 2) {
      return socket.emit('MESSAGE_RECEIVE', { message: "Your buddy is currently offline.", user: 'Notice', time: Date.now  })
    }
    //Get the index of the user whose buddy is sending the message
    const i = connection.findIndex(user => user.buddy === client.user);
    //Send the message to the user
    socket.to(connection[i].id).emit('MESSAGE_RECEIVE', payload);
  });
  
  //Remove the user object from the users array upon disconnection to clean up the session
  socket.on('disconnect', reason => {
    console.log(reason, socket.id);
    userIndex = users.findIndex(user => user.id === socket.id);
    const disconnected = users.splice(userIndex, 1)[0];
    if(connection.length === 2){
      const buddySocket = connection[connection.findIndex(u => u.buddy === disconnected.user)].id;
      socket.to(buddySocket).emit('BUDDY_ONLINE', false);
      connection = [];
    }
  });
});


server.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));