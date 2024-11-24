// React
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

// Components
import Redir from './Redir';

export default function Home() {
	const [username, setUsername] = useState<string>("username goes here");

	// Get username
	const navigate = useNavigate();
	const { state } = useLocation();
	useEffect(() => {
		if (state?.username) {
			setUsername(state.username);
		} else {
			// If no 'username' in state, redirect to login page (/)
			navigate("/");
		}
	}, [state, navigate])

	return (
		<>
			{
			// Check if the state (containing username) is present before showing
			!state ? null :
			<>
				<h1>Home</h1>
				<div className="list-row">
					<Redir to="/create" content="Create Room" state={{username: username}} />
					<Redir to="/join" content="Join Room" state={{username: username}} />
				</div>

				<p>Currently logged in as [{username}]</p>
			</>}
		</>
	)
}
