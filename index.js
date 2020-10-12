const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const directories = require('./directories');

const app = express();
const server = http.createServer(app);
const io = socketio(server);


let currentDirectory = directories;
let currentDirectoryName = '/';

app.get('/', (req, res, next) => {
    res.status(200).json({ status: 'ok' })
})

const getSubDirectory = (route) => {
    if (route) {
        return Object.keys(route).toString().split(',').join("\t")
    }
    return ' '
}


io.on('connection', socket => {
    socket.on('message', message => {

        switch (message) {
            case 'help':
                socket.emit('message', 'ls: list all files for current directory\n\tcd: change directory\n\tpwd: get current directory\n\tclear: clean the cli\n\tcat: open a file')
                return;
            case 'ls':
                socket.emit('message', getSubDirectory(currentDirectory))
                return;
            case 'pwd':
                socket.emit('message', currentDirectoryName)
                return;
            default:
                if (message.startsWith('cd')) {
                    let route = message.split(" ")[1];
                    if (route) {
                        if (route.startsWith('..')) {
                            let jumpCnt = route.split('/').length;
                            for (let i = 0; i < jumpCnt; i++) {
                                let newRoute = currentDirectoryName.split('/');
                                newRoute.pop()
                                newRoute.pop()
                                newRoute.shift();
                                currentDirectory = directories
                                currentDirectoryName = '/'
                                newRoute.forEach((value, key) => {
                                    currentDirectory = currentDirectory[value]
                                    currentDirectoryName += (value + '/')
                                })
                            }
                            socket.emit('message', `switched to ${currentDirectoryName}`)
                            return;

                        } else {
                            if (currentDirectory[route] !== undefined) {
                                currentDirectory = currentDirectory[route];
                                currentDirectoryName = currentDirectoryName + route + '/';
                                socket.emit('message', `switched to ${route}`)
                                return;
                            }
                            socket.emit('message', `unkown path ${route}`)
                            return;
                        }

                    }
                }
                if (message.startsWith('cat')) {
                    let file = message.split(" ")[1];
                    if (file) {
                        if (currentDirectory[file] !== undefined) {
                            socket.emit('message', `${currentDirectory[file]}`)
                            return;
                        }
                        else {
                            socket.emit('message', `unknown file ${file}`)
                            return;
                        }
                    }
                }
                socket.emit('message', `unknown command ${message}`)
        }
    })
})


server.listen(5000);