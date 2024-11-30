// Socket
import { DefaultEventsMap, Server, Socket } from 'socket.io';

// Classes
import TempDB from './TempDB';
import Room from './Room';

// Templates
import FilmTemplate from '../templates/Film.js';
import FoodTemplate from '../templates/Food.js';
type Template = { title: string; questions: { title: string; options: string[] }[]; }


// Organising the rooms is difficult, and they need to be kept track of
// to avoid memory leaks.
// This class stores every existing room
// and the communication link between clients (sockets) and rooms (see Room class)
export default class RoomHandler {
	private static io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
	private static rooms: { [roomCode: string]: Room}; 

	static async init(io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
		// As, for security reasons, the server (io) shouldn't be
		// added into every single room, its put here instead
		this.io = io;

		// Keeps track of all currently running rooms
		this.rooms = {};
	}

	// Create a new Room instance
	static async CreateRoom(socket: Socket, roomData: {template: string, size: number}, hostID: string) {
		// Get chosen template
		var templateJSON: Template = FoodTemplate;
		switch(roomData.template) {
			case "Food":
				templateJSON = FoodTemplate;
				break;
			case "Film":
				templateJSON = FilmTemplate;
				break;
		}
		
		// Get invite code to create Room obj.
		var inviteCode = await this.GenerateInviteCode();
		this.rooms[inviteCode] = new Room(socket, hostID, templateJSON.title, roomData.size, inviteCode, templateJSON.questions)
	}

	static async JoinRoom(socket: Socket, roomCode: string, guestID: string) {
		// Get Room instance
		const room = this.rooms[roomCode];
		if (!room) {
			console.log(this.rooms);
			console.error(`Room ${roomCode} does not exist!`);
			return;
		};

        // Create connection between client and room (max 1 connection)
		const roomID_DBReq: any = await TempDB.get("SELECT id FROM Room WHERE inviteCode = ?", [roomCode]);
		const roomID = roomID_DBReq.id;
		await TempDB.run("INSERT INTO Connection (roomID, accountID) VALUES (?, ?)", [roomID, guestID])
		
		// Join host to room
		room.JoinRoom(socket, guestID);
	}

	static async LeaveRoom(socket: Socket, roomCode: string, accountID: string) {
		// Get Room instance
		const room = this.rooms[roomCode];
		if (!room) {
			console.error(`Room ${roomCode} does not exist!`);
			return;
		};

		// Disconnect socket from room
		socket.leave(roomCode)

		// Leave room (DB)
		room.LeaveRoom(accountID);
	}
	// Advance a specific room to the next question
	static async NextQuestion(roomCode: string, accountID: string) {
		// Get Room instance
		const room = this.rooms[roomCode];
		if (!room) {
			console.error(`Room ${roomCode} does not exist!`);
			return;
		};

		// Confirm host privileges
		const isHost = await room.CheckIfHost(accountID);
		if (isHost) {
			// Get question data
			const roomData = await room.GetNextQuestion()

			// Update all users in room with new question
			this.io.to(roomCode).emit("res: room-data", roomData)
		}
	}
	
	// Close a specific room
	static async CloseRoom(roomCode: string, accountID: string) {
		// Get Room instance
		const room = this.rooms[roomCode];
		if (!room) {
			console.error(`Room ${roomCode} does not exist!`);
			return;
		};

		// Confirm host privileges
		const isHost = await room.CheckIfHost(accountID);
		if (isHost) {
			// Get room analytics and relay to all room participants
			const analytics = await room.CreateAnalytics();
			this.io.to(roomCode).emit("res: close-room", analytics)
			
			// Wait for the room to delete all DB room data
			await room.CloseRoom();

			// Disconnect all sockets from room
			const socketsInRoom = await this.io.in(roomCode).fetchSockets()
			socketsInRoom.forEach((socket) => {
				socket.leave(roomCode);
			});

			// Delete Room instance (prevents memory leak)
			delete this.rooms[roomCode]
		}
	}

	// Submit a vote to a specific room
	static async SubmitVote(roomCode: string, option: string, accountID: string) {
		// Get Room instance
		const room = this.rooms[roomCode];
		if (!room) {
			console.error(`Room ${roomCode} does not exist!`);
			return;
		};

		// Submit vote to Room
		room.SubmitVote(accountID, option);
	}

	// Get the room data from a specific room
	static async GetRoomData(socket: Socket, inviteCode: string) {
		// Get Room instance
		const room = this.rooms[inviteCode];
		if (!room) {
			console.error(`Room ${inviteCode} does not exist!`);
			return;
		};

		// Get data from instance and relay back to client
		const roomData = await room.GetRoomData();
		socket.emit("res: room-data", roomData);
	}

	private static async GenerateInviteCode() {
        const alphanumericList = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        var code = "";
        
        // Repeat until the code is valid for use
        var validCode = false;
        while (!validCode) {
            
            // Create invite code (6 randomised alphanumberic (upper-case) characters)
            for (let i=0; i<6; i++) {
                code += alphanumericList[Math.floor(Math.random() * alphanumericList.length)];
            }

            // Make sure that the invite code isn't already taken
			const duplicateCodes = await TempDB.all("SELECT * FROM Room WHERE inviteCode = ?", [code])
			if (duplicateCodes.length == 0) {
				validCode = true;
			} else {
				console.log(`INVALID CODE '${code}' - retrying..`)
				code = ""
			}
        }

        return code
    }

}