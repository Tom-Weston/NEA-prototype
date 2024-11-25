// Socket
import { DefaultEventsMap, Server, Socket } from 'socket.io';

// Classes
import TempDB from './TempDB';
import Room from './Room';

// Templates
import FilmTemplate from '../templates/Film.js';
import FoodTemplate from '../templates/Food.js';

type Template = { title: string; questions: { title: string; options: string[]; }[]; }

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


	static async GetRoomData(socket: Socket, inviteCode: string) {
		const room = this.rooms[inviteCode];
		if (!room) {
			console.error(`Room ${inviteCode} does not exist!`);
			return;
		};

		const roomData = await room.GetRoomData();

		socket.emit("res: room-data", roomData);
	}


	static async NextQuestion(roomCode: string, accountID: string) {
		// Get room and confirm host privileges
		const room = this.rooms[roomCode];
		if (!room) {
			console.error(`Room ${roomCode} does not exist!`);
			return;
		};

		const isHost = await room.CheckIfHost(accountID);

		if (isHost) {
			// Get question data
			const roomData = await room.GetNextQuestion()

			// Update all users in room with new question
			this.io.to(roomCode).emit("res: room-data", roomData)
		}
	}


	static async CreateRoom(socket: Socket, roomData: {template: string, size: number}, hostID: string) {
		// Template detection system
		var templateJSON: Template = FoodTemplate;
		if (roomData.template == "Food") {
			templateJSON = FoodTemplate;
		} else if (roomData.template == "Film") {
			templateJSON = FilmTemplate;
		};
		
		// Get invite code to create Room obj.
		var inviteCode = await this.GenerateInviteCode();
		this.rooms[inviteCode] = new Room(socket, hostID, templateJSON.title, roomData.size, inviteCode, templateJSON.questions)
	}


	static async JoinRoom(socket: Socket, inviteCode: string, guestID: string) {
		const room = this.rooms[inviteCode];
		if (!room) {
			console.log(this.rooms);
			console.error(`Room ${inviteCode} does not exist!`);
			return;
		};

        // Create connection between client and room (max 1 connection)
		const roomID_DBReq: any = await TempDB.get("SELECT id FROM Room WHERE inviteCode = ?", [inviteCode]);
		const roomID = roomID_DBReq.id;

		await TempDB.run("INSERT INTO Connection (roomID, accountID) VALUES (?, ?)", [roomID, guestID])
		
		// Join room
		room.JoinRoom(socket, guestID);
	}


	static async SubmitVote(roomCode: string, option: string, accountID: string) {
		const room = this.rooms[roomCode];
		if (!room) {
			console.error(`Room ${roomCode} does not exist!`);
			return;
		};

		room.SubmitVote(accountID, option);
	}


	static async GenerateInviteCode() {
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