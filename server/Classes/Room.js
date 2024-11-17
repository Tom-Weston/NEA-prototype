import TempDB from "./TempDB.js";

export default class Room {
	constructor(socket, title, size, inviteCode, questions) {		
		// Socket (client-server connection)
		this.socket = socket;

		console.log(this.socket.id);

		// Store main room information (incl. host account ID)
		this.title = title;
		this.size = size;
		this.host = socket.id
		this.inviteCode = inviteCode

		// Store all room questions (& qIndex tracker)
		this.questions = questions;
		this.qIndex = 0;

		// Add Room into DB
		this.init();
		
		// Redirect host to room
		socket.emit("res: join-room", {inviteCode: inviteCode});

		// Then handle client-server events
		this.HandleRoomEvents();
	}

	async init() {
		// Create room in DB
		await TempDB.run(`
		INSERT INTO Room (title, inviteCode, maxSize, hostAccountID)
		VALUES (?, ?, ?, ?)`,
		[this.title, this.inviteCode, this.size, this.socket.id])
		
		console.log(`---------------> [${this.inviteCode}] NEW ROOM (${this.size}) <---------------`);
        console.log(`Host: '${this.socket.id}' | Title: ${this.title}\n`);
	}

	async HandleRoomEvents() {
		this.socket.on("req: room-data", () => {
			socket.emit("res: room-data", {title: this.title, question: this.questions[this.qIndex]});
		});

		this.socket.on("req: question-data", () => {
			socket.emit("res: question-data", this.questions[this.qIndex]);
		});
	}

	async GetRoomData() {
		return {
			title: this.title,
			question: await this.GetCurrentQuestion()
		}
	}

	async GetCurrentQuestion() {
		return this.questions[this.qIndex]
	}
}
