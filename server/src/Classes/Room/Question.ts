type Votes = {
	[accountID: string]: {
		option: string,
		timestamp: number
	}
}

export default class Question {
	private title: string;
	private options: string[];
	
	private votes: Votes;

	private creationTime: number;

	constructor(title: string, options: string[]) {
		this.title = title;
		this.options = options;
		
		this.votes = {} as Votes;
		
		this.creationTime = Date.now();
	}

	// Saves vote to votes instance
	public async SubmitVote(accountID: string, votedOption: string) {
		this.votes[accountID] = {
			option: votedOption,
			timestamp: Date.now()
		};
	}

	public getAnalytics() {
		return {
			title: this.title,
			iniTimestamp: this.creationTime,
			votes: this.votes
		};
	}
}