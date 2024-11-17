// Classes
import TempDB from './TempDB.js';
import Room from './Room.js';

// Templates
import FoodTemplate from '../templates/Film.js';
import FilmTemplate from '../templates/Food.js';

export default class RoomHandler {
	
	static async CreateRoom(socket, roomData) {
		// Template detection system
		var templateJSON;
		if (roomData.template == "Food") {
			templateJSON = FoodTemplate;
		} else if (roomData.template == "Film") {
			templateJSON = FilmTemplate;
		};

		// Store title in the room info
		roomData = {...roomData, title: templateJSON.title};

		// Questions aren't stored in the room info as not all of them will be sent to the user initially
		const questions = templateJSON.questions

		// Get invite code and store in room info
		var inviteCode = await this.GenerateInviteCode();
		roomData = {...roomData, inviteCode: inviteCode};

        console.log(`---------------> [${roomData.inviteCode}] NEW ROOM (${roomData.size}) <---------------`);
        console.log(`Host: '${socket.id}' | Title: ${roomData.title}\n`);

		// Create room in DB
		await TempDB.run(`
		INSERT INTO Room (title, inviteCode, maxSize, hostAccountID)
		VALUES (?, ?, ?, ?)`,
		[roomData.title, roomData.inviteCode, roomData.size, socket.id])
		
		// Get the room ID from the newly created room (and store in roomData)
		const roomID = (await TempDB.get("SELECT id FROM Room WHERE inviteCode = ?", [roomData.inviteCode])).id;
		roomData = {...roomData, id: roomID};

		// Store info in DB for each (sub-)question in the room
		// Unfortunately, getting the unix timestamp doesn't make the questions different, so the index (from 0) is used instead
		questions.forEach(async (question, index) => {

			// Get unix timestamp (in ms) (from https://stackoverflow.com/questions/221294/how-do-i-get-a-timestamp-in-javascript)
			const timestamp = Date.now()

			// Store questions in DB (linked by room ID)
			await TempDB.run(`
			INSERT INTO Question (count, title, creationTime, roomID)
			VALUES (?, ?, ?, ?)`,
			[index, question.title, timestamp, roomData.id]);
			
			// Store options in DB (linked by question ID got by index counter)
			const questionID = (await TempDB.get("SELECT id FROM Question WHERE count = ? and roomID = ?", [index, roomData.id])).id;
			question.options.forEach(async option => {
				await TempDB.run(`
				INSERT INTO Option (name, questionID)
				VALUES (?, ?)`,
				[option, questionID]);
			});
		});

		
		
		// Add the correct question values into the roomData
		roomData = {...roomData, question: {title: currQuestion.title, options: currOptions}}
		
		// Join room (w/ room data)
		socket.emit('res: join-room', roomData);
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