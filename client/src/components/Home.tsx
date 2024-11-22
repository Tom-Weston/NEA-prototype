// React
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

// Components
import Redir from './Redir';

export default function Home() {
	const navigate = useNavigate();
	const { state } = useLocation();

	// If no 'username' in state, redirect to login page (/)
	useEffect(() => {
		if (!state?.username) {
			navigate("/");
		}
	}, [state, navigate])

	return (
		<>
			{
			// Check if the state (username) is present before showing
			!state ? <></> :
			<>
				<h1>Home</h1>
				<div className="list-row">
					<Redir to="/create" content="Create Room" state={{username: state.username}} />
					<Redir to="/join" content="Join Room" state={{username: state.username}} />
				</div>

				<p>Currently logged in as [{state.username}]</p>
			</>}
		</>
	)
}
