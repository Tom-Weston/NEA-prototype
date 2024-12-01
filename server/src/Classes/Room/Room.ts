// Socket
import { Socket } from "socket.io";

// Components
import TempDB from "../TempDB";
import Question from "./Question";
import RoomAnalytics from "./RoomAnalytics";

type QuestionConst = {
	title: string;
	options: string[];
}

type Analytics = {
	title: string,
	reactionTimes: ReactionTime[]
}

type ReactionTime = {
	questionTitle: string,
	// Reaction times sorted from fastest to slowest
	times: {
		accountID: string,
		// Time (ms)
		time: number
	}[]
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

	constructor(socket: Socket, hostID: string, title: string, size: number, inviteCode: string, questions: QuestionConst[]) {	
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
		this.questions = [];
		questions.forEach(qData => {
			this.questions.push(new Question(qData.title, qData.options));
		});
		this.qIndex = 0;

		// Add Room into DB
		this.init();

		// Join host socket to room (socket-side & redirect client-side)
		socket.join(this.inviteCode);
		socket.emit("res: join-room", {inviteCode: this.inviteCode});
	}

	// Initialise room DB-side
	private async init() {

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

	// User joining room
	public async JoinRoom(socket: Socket, accountID: string) {
		// Reject if guest list is full
		if (this.isRoomFull()) { return }

		// Add to guest list & join room
		this.guests.push(accountID);
		await socket.join(this.inviteCode);

		// Join room client-side
		socket.emit('res: join-room', {inviteCode: this.inviteCode});
	}

	// User leaving room
	public async LeaveRoom(accountID: string) {
		// Delete user connection records to the room (from DB)
		await TempDB.run("DELETE FROM Connection WHERE accountID = ?", [accountID]);
		
		// Remove user from guest list (NOTE: Analytics will NOT be affected)
		// (from: https://stackoverflow.com/questions/5767325/how-can-i-remove-a-specific-item-from-an-array-in-javascript)
		const guestIndex = this.guests.indexOf(accountID);
		if (guestIndex > -1) {
			this.guests.splice(guestIndex, 1)
		}
	}

	// Handle a new vote submission by a user
	public async SubmitVote(accountID: string, votedOption: string) {
		const currQuestion = this.questions[this.qIndex];
		await currQuestion.SubmitVote(accountID, votedOption);
	}

	// Create room analytics
	public async CreateAnalytics(): Promise<Analytics> {
		// Get list of all participants (host + guests)
		const users = Array.prototype.concat(this.guests, [this.host])
		
		// Create analytics and extract reaction times
		const analytics = new RoomAnalytics(users, this.questions);
		const reactionTimes = await analytics.GetReactionTimes();

		return {
			title: this.title,
			reactionTimes: reactionTimes
		}
	}

	// Close the room (DB-side)
	public async CloseRoom() {
		// Delete all user connection records to the room (from DB)
		await TempDB.run("DELETE FROM Connection WHERE roomID = ?", [this.id]);

		// Delete room record (from DB)
		await TempDB.run("DELETE FROM Room WHERE id = ?", [this.id]);
	}

	// Gets the information for the next question
	public async GetNextQuestion() {
		// Increment pointer to next question
		this.qIndex += 1

		// Get data from question & return
		const roomData = await this.GetRoomData();
		return roomData;
	}

	// Gets room title and current question data
	public async GetRoomData() {
		// Check if it's the last question for the room
		// If so, then client-side will hide the "Next Question" button
		const isLastQuestion = (this.qIndex >= this.questions.length - 1);

		return {
			title: this.title,
			question: await this.GetCurrentQuestion(),
			lastQuestion: isLastQuestion
		}
	}

	// Check if the user is the host of the room
	public async isHost(accountID: string) {
		return accountID == this.host
	}

	// Gets the information for the current question
	// NOTE: Clamped so that only the last question can be gotten after the end
	private async GetCurrentQuestion() {
		return this.questions[Math.min(this.qIndex, this.questions.length - 1)]
	}

	// Checks if room is full (incl. host)
	private isRoomFull(): boolean {
		return 1 + this.guests.length >= this.maxSize;
	}
}
