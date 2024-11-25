// Server (w/ CORS)
import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';

// Components
// NOTE: extention is '.js' as it is compiled that way
import TempDB from './Classes/TempDB';
import RoomHandler from './Classes/RoomHandler'

TempDB.init();

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

RoomHandler.init(io);

io.on("connection", (socket) => {

	socket.on('req: join-room', ({room, name}) => {
		RoomHandler.JoinRoom(socket, room, name);
	})

	socket.on('req: room-data', (room) => {
		RoomHandler.GetRoomData(socket, room);
	})

	socket.on('req: create-room', ({roomInfo, host}) => {
		RoomHandler.CreateRoom(socket, roomInfo, host);
	})

	socket.on("req: next-question", ({room, name}) => {
		RoomHandler.NextQuestion(room, name);
	});

	socket.on("req: submit-vote", ({room, option, name}) => {
		RoomHandler.SubmitVote(room, option, name);
	});
});

server.listen(PORT, () => {
	console.log(`Listening on *:${PORT}`);
});
