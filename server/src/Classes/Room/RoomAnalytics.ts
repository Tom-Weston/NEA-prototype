// Components
import Essential from "../Essential";
import Question from "./Question";

type QuestionData = {
	title: string,
	iniTimestamp: number,

	// Uses a dictionary (hash map) instead of an array
	// to remove duplicate entries (vote skew)
	votes: {
		[accountID: string]: {
			option: string,
			timestamp: number
		}
	}
}

type ReactionTime = {
	questionTitle: string,
	// Reaction times sorted from fastest to slowest
	times: TimeData[]
}

type TimeData = {
	accountID: string,
	time: number		// in ms
}

export default class RoomAnalytics {
	private users: string[];
	private questions: Question[];
	
	private analytics: QuestionData[];
	private reactionTimes: ReactionTime[];

	constructor(users: string[], questions: Question[]) {
		this.users = users;
		this.questions = questions;
		
		// Init 'analytics' attribute
		this.analytics = this.CreateAnalytics();
		this.reactionTimes = this.CreateReactionTimes();
	}

	// Create analytics basis
	private CreateAnalytics(): QuestionData[] {
		let analytics = [] as QuestionData[];

		// Insert the question into the analytics
		// This assigns the "timestamp" used for reaction speed analytics
		this.questions.forEach(question => {
			const questionAnalytics = question.getAnalytics();
			analytics.push(questionAnalytics); 
		});

		return analytics;
	}

	private CreateReactionTimes(): ReactionTime[] {	
		let reactionTimes = [] as ReactionTime[];

		// Iterate through each question
		this.analytics.forEach(questionAnalytics => {
			// Extract data
			const {title, iniTimestamp, votes} = questionAnalytics;

			// Store reaction times in an array (for quick-sort implementation)
			// NOTE: 	Since the QuickSort algorithm can only take in an array
			//			an array data structure is used instead of a hash map
			var questionReactionTimes: [string, number][] = [];

			// Extract each key and value from the dictionary like an enumerated array
			// then process into respective arrays for analysis processing
			// (from: https://stackoverflow.com/questions/34913675/how-to-iterate-keys-values-in-javascript)
			for (const [accountID, {option, timestamp}] of Object.entries(votes)) {
				questionReactionTimes.push([accountID, timestamp - iniTimestamp]);
			}

			// Sort reaction times and import to overall reaction times
			questionReactionTimes = Essential.QuickSort(questionReactionTimes, [1]);

			// Re-organise the reaction times into a hash map
			let organisedQuestionReactionTimes = [] as TimeData[];
			questionReactionTimes.forEach((obj) => {
				organisedQuestionReactionTimes.push({accountID: obj[0], time: obj[1]})
			});

			// Append question data to main array
			reactionTimes.push({
				questionTitle: title,
				times: organisedQuestionReactionTimes
			});
		});

		return reactionTimes;
	}

	public async GetReactionTimes() {
		return this.reactionTimes
	}
}
