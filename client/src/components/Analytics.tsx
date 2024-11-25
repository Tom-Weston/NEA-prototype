// React
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Components
import Redir from "./Redir";

export default function Home() {
	const [username, setUsername] = useState<string>("username goes here");
	const [analytics, setAnalytics] = useState<string>("analytics goes here");

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
		

		if (!valid) { /*navigate("/");*/ }
	}, [state, navigate])
	
	// Extract analytics on page enter
	useEffect(() => {
		
	});

	return (
		<>
			<div className="list-col">
				<h1>ROOM TITLE</h1>
				[ROOM CLOSED]
				
				<br /><br /><br />

				{ /* Analytics */}
				{(!state) ? "no analytics!" :
					<div>
						{analytics}
						<p>Analytic 1</p>
						<p>Analytic 2</p>
						<p>Analytic 3</p>
					</div>
				}
			</div>

			<Redir to="/" content="Return to Main Menu" state={{username: username}}></Redir>
		</>
	)
}
