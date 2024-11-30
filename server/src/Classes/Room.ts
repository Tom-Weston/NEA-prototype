// Socket
import { Socket } from "socket.io";

// Components
import TempDB from "./TempDB";
import Essential from "./Essential";

type Question = {
	title: string;
	options: string[];
}

type VoteData = {
	option: string,
	timestamp: number
}

type Analytics = {
	title: string,
	reactionTimes: ReactionTime[]
}

type QuestionData = {
	title: string,
	iniTimestamp: number,

	// Uses a dictionary (hash map) instead of an array
	// to remove duplicate entries (vote skew)
	votes: {
		[accountID: string]: VoteData
	}
}[]

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

	private analytics: QuestionData;

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

		// Store all voting data
		this.analytics = [] as QuestionData		

		// Add Room into DB
		this.init();
		
		// Update analytics for current (first) question
		this.UpdateQuestionAnalytics();

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

		// Insert the question into the analytics
		// This assigns the "timestamp" used for reaction speed analytics
		await this.UpdateQuestionAnalytics();

		// Get data from question & return
		const roomData = await this.GetRoomData();
		return roomData;
	}

	// Create room analytics
	async CreateAnalytics(): Promise<Analytics> {

		// Reaction Times Analytics		
		var reactionTimes: ReactionTime[] = [];
		this.analytics.forEach(questionAnalytics => {
			const {title, iniTimestamp, votes} = questionAnalytics;

			// Store reaction times in an array (for quick-sort implementation)
			var questionReactionTimes: {accountID: string, time: number}[] = []

			// Extract each key and value from the dictionary like an enumerated array
			// then process into respective arrays for analysis processing
			// (from: https://stackoverflow.com/questions/34913675/how-to-iterate-keys-values-in-javascript)
			for (const [accountID, {option, timestamp}] of Object.entries(votes)) {
				questionReactionTimes.push({accountID: accountID, time: timestamp - iniTimestamp});
			}

			// Sort reaction times and import to overall reaction times
			questionReactionTimes = Essential.QuickSort(questionReactionTimes, [1]);
			reactionTimes.push({
				questionTitle: title,
				times: questionReactionTimes
			});
		});

		return {
			title: this.title,
			reactionTimes: reactionTimes
		}
	}

	// Close the room (DB-side)
	async CloseRoom() {
		// Delete all user connection records to the room (from DB)
		await TempDB.run("DELETE FROM Connection WHERE roomID = ?", [this.id]);

		// Delete room record (from DB)
		await TempDB.run("DELETE FROM Room WHERE id = ?", [this.id]);
	}

	// Gets room title and current question data
	async GetRoomData() {
		return {
			title: this.title,
			question: await this.GetCurrentQuestion(),
			lastQuestion: this.qIndex >= this.questions.length - 1
		}
	}

	// Check if the user is the host of the room
	async CheckIfHost(accountID: string) {
		return accountID == this.host
	}

	// Handle a new vote submission by a user
	async SubmitVote(accountID: string, votedOption: string) {

		// Update question-specific voting data
		const roomAnalyticalData = this.analytics[this.qIndex];
		const voteData: VoteData = {option: votedOption, timestamp: Date.now()};

		roomAnalyticalData.votes[accountID] = voteData;
	}
	
	// Handle question data (when moving onto the next question)
	private async UpdateQuestionAnalytics() {
		// Update question-specific voting data (with starting timestamp)
		const qTitle = this.questions[this.qIndex].title
		const questionVoteData = {title: qTitle, iniTimestamp: Date.now(), votes: {}}

		// Update previous voting store with new data
		this.analytics.push(questionVoteData);
	}

	// Gets the information for the current question
	// NOTE: Clamped so that only the last question can be gotten after the end
	private async GetCurrentQuestion() {
		return this.questions[Math.min(this.qIndex, this.questions.length - 1)]
	}
}
