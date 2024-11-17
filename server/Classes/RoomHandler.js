// Classes
import TempDB from './TempDB.js';
import Room from './Room.js';

// Templates
import FoodTemplate from '../templates/Film.js';
import FilmTemplate from '../templates/Food.js';

export default class RoomHandler {
	
	static async init() {
		this.rooms = {}
	}

	static async CreateRoom(socket, roomData) {
		// Template detection system
		var templateJSON;
		if (roomData.template == "Food") {
			templateJSON = FoodTemplate;
		} else if (roomData.template == "Film") {
			templateJSON = FilmTemplate;
		};
		
		// Get invite code
		var inviteCode = await this.GenerateInviteCode();

		console.log(socket.id)
		this.rooms[inviteCode] = new Room(socket, templateJSON.title, roomData.size, inviteCode, templateJSON.questions)

		console.log("Rooms now: ")
		console.log(this.rooms)
	}

	static async GetRoomData(socket, inviteCode) {
		console.log("Current rooms: ")
		console.log(this.rooms);

		console.log("Code: " + inviteCode)

		const room = this.rooms[inviteCode];
		const roomData = await room.GetRoomData();

		socket.emit("res: room-data", roomData);
	}

	static async JoinRoom(socket, inviteCode) {

        // NEED TO ADD [CREATE A CONNECTION BETWEEN THE CLIENT AND THE ROOM]
		const roomID = await TempDB.get("SELECT id FROM Room WHERE inviteCode = ?", [inviteCode])
		console.log("Room ID: " + roomID)
		await TempDB.run("INSERT INTO Connection (roomID, accountID) VALUES (?, ?)", [roomID, socket.id])

		socket.join(inviteCode);
		
		// NEED TO ADD [GET ROOM DATA FROM DB]
		// INCLUDES:
		// - INVITE CODE [ROOM]
		// - TITLE [ROOM]
		// - CURRENT QUESTION [ROOM]
		// - rest is handled by templates [as this is a prototype]
		const rawRoomData = await TempDB.get("SELECT title, inviteCode FROM Room WHERE inviteCode = ?", [inviteCode]);
		const rawQuestionData = await TempDB.get("SELECT title FROM Question WHERE roomID = ? AND count = ?", [roomID, count]);
		console.log(rawRoomData);
		console.log(rawQuestionData);

		// yk what nvm for future me looking at this scratch this
		// in CreateRoom() just put the server socket into a state
		// where the client emits "get-data" and the room socket responds with "room-data"
		// boom done please add 🙏

		// TEMPORARY [REMOVE LATER]
		const roomData = {
			'abc': {
				inviteCode: "ABC123",
				title: "Room 1",
				question: "My question",
				options: ['a', 'b', 'c']
			},
			'123': {
				inviteCode: "CBA321",
				title: "Room 12",
				question: "Your question",
				options: ['1', '2', '3']
			},
			'usd': {
				inviteCode: "AOW023",
				title: "Room 8",
				question: "Some other question",
				options: ['u', 's', 'd']
			}
		};
		
		// Join room (w/ room data)
		socket.emit('res: join-room', roomData[inviteCode]);
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

            // NEED TO ADD [LOOKUP VALIDATION FROM DB]

            // [[[TEMP]]]
            // console.log("Created a unique code!")
            validCode = true;
        }

        return code
    }

}