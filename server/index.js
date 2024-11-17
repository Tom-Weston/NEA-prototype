import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';

import TempDB from './Classes/TempDB.js';
import RoomHandler from './Classes/RoomHandler.js'

TempDB.init();
RoomHandler.init();

const app = express();
const server = http.createServer(app);

const PORT = 3001;
const CLIENT_ORIGIN = "http://localhost:5173"

// Configure CORS for Express
app.use(cors({
	origin: CLIENT_ORIGIN,
	credentials: true
}));

// Attach Socket.IO to the HTTP server, using the same port (3003)
const io = new Server(server, {
	cors: {
		origin: CLIENT_ORIGIN,
		methods: ["GET", "POST"],
		credentials: true
	}
});

io.on("connection", (socket) => {
	// console.log("User connected.");

	socket.on('req: join-room', (room) => {
		RoomHandler.JoinRoom(socket, room);
	})

	socket.on('req: room-data', (room) => {
		RoomHandler.GetRoomData(socket, room);
	})

	socket.on('req: create-room', (roomInfo) => {
		RoomHandler.CreateRoom(socket, roomInfo);
	})
});

server.listen(PORT, () => {
	console.log(`Listening on *:${PORT}`);
});
