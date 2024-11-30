// React
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Components
import Redir from "./Redir";

type ReactionTime = {
	questionTitle: string,
	times: {
		accountID: string,
		// Time (ms)
		time: number
	}[]
}

type Analytics = {
	title: string,
	reactionTimes: ReactionTime[]
}

export default function Analytics() {
	const [username, setUsername] = useState<string>("username goes here");
	const [analytics, setAnalytics] = useState<Analytics>({} as Analytics);

	// Get username & analytics data
	const { state } = useLocation();
	const navigate = useNavigate();
	useEffect(() => {
		let valid = true;
		if (state?.username)
			setUsername(state.username);
		else 
			valid = false;

		if (state?.analytics)
			setAnalytics(state.analytics)
		else
			valid = false;
		

		if (!valid) { alert("no analytics / username?"); navigate("/"); }
	}, [state, navigate])

	// Extract analytics on page enter
	useEffect(() => {
		if (state?.analytics) {
			setAnalytics(state.analytics);
			console.log(state.analytics);
		}
	}, [state]);

	return (
		<>
			<div className="list-col">
				{(!analytics?.reactionTimes) ? "no analytics!" :
				<>
					<h1>{analytics.title}</h1>
					[ROOM CLOSED]
					
					<br /><br /><br />

					{ /* Analytics */}
					
						<div>
							<h2 style={{textAlign: "center"}}>Reaction Times</h2>
							<div>
								{analytics.reactionTimes.map((reactionTimes) => {
									
									const {questionTitle, times} = reactionTimes;
									
									return (
									<div key={questionTitle} className="list-col">
										<h3 style={{marginBottom: 0}}>{questionTitle}</h3>
										{times.map((user) => {
											const {time, accountID} = user;

											return (<p style={{margin: 0}}>{Math.round(time/10) / 100}s by {accountID}</p>)
										}
											
										)}
									</div>
									)
								}
								
								)}
							</div>
						</div>
				</>
				}
			</div>

			<Redir to="/" content="Return to Main Menu" state={{username: username}}></Redir>
		</>
	)
}
