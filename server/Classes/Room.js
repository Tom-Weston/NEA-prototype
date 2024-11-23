import TempDB from "./TempDB.js";

export default class Room {
	constructor(socket, hostID, title, size, inviteCode, questions) {	
		// [room id got in init()]
		this.id;

		// Store main room information
		this.title = title;
		this.maxSize = size;
		this.inviteCode = inviteCode

		// Participants (sockets)
		this.host = hostID;
		this.guests = [];

		// Store all room questions (& qIndex tracker)
		this.questions = questions;
		this.qIndex = 0;

		// Add Room into DB
		this.init();
		
		// Join host socket to room (socket-side & redirect client-side)
		socket.join(this.inviteCode);
		socket.emit("res: join-room", {inviteCode: this.inviteCode});
	}

	async init() {
		// Create room in DB
		await TempDB.run(`
		INSERT INTO Room (title, inviteCode, maxSize, hostAccountID)
		VALUES (?, ?, ?, ?)`,
		[this.title, this.inviteCode, this.maxSize, this.host])

		// Get room id
		this.id = (await TempDB.get("SELECT id FROM Room WHERE inviteCode = ?", [this.inviteCode])).id;
		
		// Create connection between host and room
		await TempDB.run("INSERT INTO Connection (roomID, accountID) VALUES (?, ?)", [this.id, this.host])

		console.log(`---------------> [${this.inviteCode}] NEW ROOM (1 / ${this.maxSize}) <---------------`);
        console.log(`Host: '${this.host}' | Title: ${this.title}\n`);
	}

	// Gets room title and current question data
	async GetRoomData() {
		return {
			title: this.title,
			question: await this.GetCurrentQuestion()
		}
	}

	// Gets the information for the next question
	async GetNextQuestion() {
		// Increment pointer to next question
		this.qIndex += 1

		// Get data from question & return
		const roomData = await this.GetRoomData();
		return roomData;
	}

	async JoinRoom(socket, accountID) {
		// Reject if guest list is full
		if (this.guests.length + 1 >= this.maxSize) { return }

		// Add to guest list
		this.guests.push(accountID);

		// Join socket to room
		await socket.join(this.inviteCode);

		// Join room client-side
		socket.emit('res: join-room', {inviteCode: this.inviteCode});
	}

	// [PRIVATE] Gets the information for the current question
	async GetCurrentQuestion() {
		return this.questions[this.qIndex]
	}

	// Check if the user is the host of the room
	async CheckIfHost(accountID) {
		return accountID == this.host
	}
}
