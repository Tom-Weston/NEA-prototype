import { Socket } from "socket.io";
import TempDB from "./TempDB";

type Question = {
	title: string;
	options: string[];
}

type QuestionVotes = {
	[question: string]: {
		[accountID: string]: string;
	}
}

export default class Room {
	private id: string;

	private title: string;
	private maxSize: number;
	private inviteCode: string;

	private host: string;
	private guests: string[];

	private questions: Question[];
	private qIndex: number;

	private votes: QuestionVotes;

	constructor(socket: Socket, hostID: string, title: string, size: number, inviteCode: string, questions: Question[]) {	
		// [this.id got in init()]
		this.id = "awaiting assignment " + Math.random();

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

		// Store all votes ({question: {user: vote, ...}, ...})
		this.votes = {} as QuestionVotes		

		// Add Room into DB
		this.init();
		
		// Join host socket to room (socket-side & redirect client-side)
		socket.join(this.inviteCode);
		socket.emit("res: join-room", {inviteCode: this.inviteCode});
	}

	// Initialise room DB-side
	async init() {

		// Create room in DB
		await TempDB.run(`
		INSERT INTO Room (title, inviteCode, maxSize, hostAccountID)
		VALUES (?, ?, ?, ?)`,
		[this.title, this.inviteCode, String(this.maxSize), this.host]);
		
		// Assign the room ID (from DB)
		const roomID_DBReq: any = await TempDB.get("SELECT id FROM Room WHERE inviteCode = ?", [this.inviteCode]);
		this.id = roomID_DBReq.id;

		// Create connection between host and room
		await TempDB.run("INSERT INTO Connection (roomID, accountID) VALUES (?, ?)", [this.id, this.host])
		
		// Log room creation
		console.log(`---------------> [${this.inviteCode}] NEW ROOM (1 / ${this.maxSize}) <---------------`);
        console.log(`Host: '${this.host}' | Title: ${this.title}\n`);
	}

	async JoinRoom(socket: Socket, accountID: string) {
		// Reject if guest list is full
		if (this.guests.length + 1 >= this.maxSize) { return }

		// Add to guest list
		this.guests.push(accountID);

		// Join socket to room
		await socket.join(this.inviteCode);

		// Join room client-side
		socket.emit('res: join-room', {inviteCode: this.inviteCode});
	}

	// Gets the information for the next question
	async GetNextQuestion() {
		// Increment pointer to next question
		this.qIndex += 1

		if (this.qIndex < this.questions.length) {
			// Get data from question & return
			const roomData = await this.GetRoomData();
			return roomData;
		} else {
			// No more questions, so close the room!
			return {title: this.title, question: {title: "CLOSING ROOM", options: ["now to handle closing the room!"]}}
		}
	}

	// Handle a new vote submission by a user
	async SubmitVote(accountID: string, votedOption: string) {
		// Update question-specific voting data
		const questionVoteData = {...this.votes[this.questions[this.qIndex].title], [accountID]: votedOption}

		// Update previous voting store with new data
		this.votes = {...this.votes, [this.questions[this.qIndex].title]: questionVoteData};
	}

	// Gets room title and current question data
	async GetRoomData() {
		return {
			title: this.title,
			question: await this.GetCurrentQuestion(),
			lastQuestion: this.qIndex >= this.questions.length
		}
	}

	// [PRIVATE] Gets the information for the current question
	async GetCurrentQuestion() {
		return this.questions[this.qIndex]
	}

	// Check if the user is the host of the room
	async CheckIfHost(accountID: string) {
		return accountID == this.host
	}
}
