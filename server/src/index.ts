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

// Handle socket events (from connection)
io.on("connection", (socket) => {
	// Requesting to create a room
	socket.on('req: create-room', ({roomInfo, host}) => {
		RoomHandler.CreateRoom(socket, roomInfo, host);
	});

	// Requesting to join a room
	socket.on('req: join-room', ({room, name}) => {
		RoomHandler.JoinRoom(socket, room, name);
	});

	// Requesting to leave a room
	socket.on('req: leave-room', ({room, name}) => {
		RoomHandler.LeaveRoom(socket, room, name);
	});

	// Host requesting to close the room
	socket.on("req: close-room", ({room, name}) => {
		RoomHandler.CloseRoom(room, name);
	});
	
	// Submitting an option vote to the current question in a room
	socket.on("req: submit-vote", ({room, option, name}) => {
		RoomHandler.SubmitVote(room, option, name);
	});

	// Host requesting next question for the room
	socket.on("req: next-question", ({room, name}) => {
		RoomHandler.NextQuestion(room, name);
	});
	
	// Requesting data upon joining the room
	socket.on('req: room-data', (room) => {
		RoomHandler.GetRoomData(socket, room);
	});
});

// Attach listeners to port
server.listen(PORT, () => {
	console.log(`Listening on *:${PORT}`);
});
