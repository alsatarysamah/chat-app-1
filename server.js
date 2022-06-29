'use strict';
const path = require('path');
const http = require('http');
const express = require('express');
const app = express();
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');
const { isFunction } = require('util');
const server = http.createServer(app);
const io = socketio(server);

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatCord Bot';
//run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room)
        socket.join(user.room);

        //welcome current user
        socket.emit('message', formatMessage(botName, 'Welcom to chatCord'));

        //broadcast when a user connect
        socket.broadcast
            .to(user.room)
            .emit('message',
                formatMessage(botName, `${user.username} has joined the chat`));

        //send user and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });





    //listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg))
    });
    //runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit
                ('message',
                    formatMessage(botName, `${user.username}has left the chat`)
                );
            //send user and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }

    });
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`server is working On port : ${PORT}`);
});