// Classes
import TempDB from './TempDB.js';
import Room from './Room.js';

// Templates
import FilmTemplate from '../templates/Film.js';
import FoodTemplate from '../templates/Food.js';

export default class RoomHandler {
	
	static async init(io) {
		// As, for security reasons, the server (io) shouldn't be
		// added into every single room, its put here instead
		this.io = io;

		// Keeps track of all currently running rooms
		this.rooms = {};
	}

	static async GetRoomData(socket, inviteCode) {
		const room = this.rooms[inviteCode];
		if (!room) {
			console.error(`Room ${inviteCode} does not exist!`);
			return;
		};

		const roomData = await room.GetRoomData();

		socket.emit("res: room-data", roomData);
	}

	static async NextQuestion(roomCode, name) {
		// Get room and confirm host privileges
		const room = await this.rooms[roomCode];
		const isHost = await room.CheckIfHost(name);

		if (isHost) {
			// Get question data
			const roomData = await room.GetNextQuestion()

			// Update all users in room with new question
			this.io.to(roomCode).emit("res: room-data", roomData)
		}
	}

	static async CreateRoom(socket, roomData, host) {
		// Template detection system
		var templateJSON;
		if (roomData.template == "Food") {
			templateJSON = FoodTemplate;
		} else if (roomData.template == "Film") {
			templateJSON = FilmTemplate;
		};
		
		// Get invite code to create Room obj.
		var inviteCode = await this.GenerateInviteCode();
		this.rooms[inviteCode] = new Room(socket, host, templateJSON.title, roomData.size, inviteCode, templateJSON.questions)
	}

	static async JoinRoom(socket, inviteCode, guest) {
        // Create connection between client and room (max 1 connection)
		const roomID = (await TempDB.get("SELECT id FROM Room WHERE inviteCode = ?", [inviteCode])).id;
		console.log("Room ID:");
		console.log(roomID);
		await TempDB.run("INSERT INTO Connection (roomID, accountID) VALUES (?, ?)", [roomID, guest])
		
		// Join room
		this.rooms[inviteCode].JoinRoom(socket, guest);
	}

	static async GenerateInviteCode() {
        const alphanumericList = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        var code = "";
        
        // Repeat until the code is valid for use
        var validCode = false;
        while (!validCode) {;
            
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