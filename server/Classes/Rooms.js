import FoodTemplate from '../templates/Film.js';
import FilmTemplate from '../templates/Food.js';

export default class Rooms {
	
	static async CreateRoom(socket, roomInfo) {
		// Template detection system
		var templateJSON;
		if (roomInfo.template == "Food") {
			templateJSON = FoodTemplate;
		} else if (roomInfo.template == "Film") {
			templateJSON = FilmTemplate;
		};

		// Store title and questions in the room info
		roomInfo = {...roomInfo, title: templateJSON.title, questions: templateJSON.questions};

		var invCode = await this.GenerateInviteCode();
        console.log(`---------------> [${invCode}] NEW ROOM (${roomInfo.size}) <---------------`);
        console.log(`Host: '${socket.id}' | Title: ${roomInfo.title}\n`);

		// Store invite code in the room info
		roomInfo = {...roomInfo, inviteCode: invCode};

		// NEED TO ADD [CREATE ROOM IN DB]

        // NEED TO ADD [GET ROOM ID FROM NEW ROOM IN DB AND SAVE TO CLIENT SESSION]
		
		// Join room (w/ room data)
		// NOTE: USING TEMPORARY DATA (with DB, only first question w/ options will be shown)
		socket.emit('res: join-room', roomInfo);
	}

	static async JoinRoom(socket, roomCode) {

		// NEED TO ADD [CHECK IF CLIENT IS ALREADY CONNECTED TO A ROOM]

        // NEED TO ADD [CREATE A CONNECTION BETWEEN THE CLIENT AND THE ROOM]
		
		socket.join(roomCode);
		
		// NEED TO ADD [GET ROOM DATA FROM DB]
		// INCLUDES:
		// - INVITE CODE [ROOM]
		// - TITLE [ROOM]
		// - CURRENT QUESTION [ROOM]
		// - rest is handled by templates [as this is a prototype]

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
		socket.emit('res: join-room', roomData[roomCode]);
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