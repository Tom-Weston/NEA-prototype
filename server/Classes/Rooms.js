// Classes
import TempDB from './TempDB.js';

// Templates
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

		// Store title in the room info
		roomInfo = {...roomInfo, title: templateJSON.title};

		// Questions aren't stored in the room info as not all of them will be sent to the user initially
		const questions = templateJSON.questions

		// Get invite code and store in room info
		var inviteCode = await this.GenerateInviteCode();
		roomInfo = {...roomInfo, inviteCode: inviteCode};

        console.log(`---------------> [${roomInfo.inviteCode}] NEW ROOM (${roomInfo.size}) <---------------`);
        console.log(`Host: '${socket.id}' | Title: ${roomInfo.title}\n`);

		// Create room in DB
		await TempDB.run(`
		INSERT INTO Room (title, inviteCode, maxSize, hostAccountID)
		VALUES (?, ?, ?, ?)`,
		[roomInfo.title, roomInfo.inviteCode, roomInfo.size, socket.id])
		
		// Get the room ID from the newly created room (and store in roomInfo)
		const roomID = (await TempDB.get("SELECT id FROM Room WHERE inviteCode = ?", [roomInfo.inviteCode])).id;
		roomInfo = {...roomInfo, id: roomID};

		// Store info in DB for each (sub-)question in the room
		// Unfortunately, getting the unix timestamp doesn't make the questions different, so the index (from 0) is used instead
		questions.forEach(async (question, index) => {

			// Get unix timestamp (in ms) (from https://stackoverflow.com/questions/221294/how-do-i-get-a-timestamp-in-javascript)
			const timestamp = Date.now()

			// Store questions in DB (linked by room ID)
			await TempDB.run(`
			INSERT INTO Question (count, title, creationTime, roomID)
			VALUES (?, ?, ?, ?)`,
			[index, question.title, timestamp, roomInfo.id]);
			
			// Store options in DB (linked by question ID got by index counter)
			const questionID = (await TempDB.get("SELECT id FROM Question WHERE count = ? and roomID = ?", [index, roomInfo.id])).id;
			question.options.forEach(async option => {
				await TempDB.run(`
				INSERT INTO Option (name, questionID)
				VALUES (?, ?)`,
				[option, questionID]);
			});
		});

		// As this function is asynchronous (as efficient as possible), there needs to be
		// a waiting system until all the questions and options have successfully entered the database (DB)
		// (as there is no callback when an item has been successfully stored in the DB)
		// So, a reattempt timeout of 10ms is repeated until the number of options in the DB match it locally (on average ~20ms until success)
		// tl;dr Get first question (and its options) to send to user (get from DB instead of locally to confirm connection)
		var currQuestion, currOptions;
		var success = false;
		while (!success) {
			// Attempt to get the (correct) question & options
			currQuestion = await TempDB.get("SELECT id, title from Question WHERE count = 0 AND roomID = ?", [roomInfo.id])
			currOptions = await TempDB.all("SELECT * from Option WHERE questionID = ?", [currQuestion.id])

			// Check if DB and local options match
			if (currOptions.length == questions[0].options.length) {
				success = true;
			} else {
				// Timeout for 10ms
				console.log("TIMEOUT")
				await new Promise(res => setTimeout(res, 10));
			}
		}
		
		// Add the correct question values into the roomInfo
		roomInfo = {...roomInfo, currQuestion: {title: currQuestion.title, options: currOptions}}
		
		// Join room (w/ room data)
		socket.emit('res: join-room', roomInfo);
	}

	static async JoinRoom(socket, inviteCode) {

		// NEED TO ADD [CHECK IF CLIENT IS ALREADY CONNECTED TO A ROOM]

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