// React
import { useState, useEffect, FormEvent} from 'react';
import { NavigateFunction, useLocation, useNavigate } from 'react-router-dom';

// Socket
import { Socket } from 'socket.io-client';

// Components
import Redir from "./Redir";
import SocketInfo from './SocketInfo';

function socketEvents(socket: Socket , navigate: NavigateFunction, state: { username: string }) {
	// Log when connected
	socket.on("connect", () => {
		console.log(`Connected to server [${socket.id}]`);
	});

	// When room data is sent over (send to room)
	socket.on("res: join-room", (data) => {
		navigate(`/room/${data.inviteCode}`, {state: {host: false, username: state.username}})
	});
};


export default function JoinRoom() {
	const socket = SocketInfo.inst.socket;
	const [room, setRoom] = useState<string>("room code goes here");
	const [username, setUsername] = useState<string>("username goes here");

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
	
	// Setup the socket connection
	useEffect(() => {
		socketEvents(socket, navigate, state);
	}, [socket, navigate, state]);
	
	// Called when the form is submitted
	function joinRoom(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()

		// Request to join the room
		// Then wait for "res: join-room" (see socketEvents() function)
		socket.emit("req: join-room", {room: room, name: username});
	}

	return (
		<>
			<h1>Join Room</h1>

			{/* Form info (invite code) for joining a room */}
			<form onSubmit={(e) => joinRoom(e)}>
				<input name="inviteCode" type="text" placeholder="Invite Code" onChange={(e) => setRoom(e.target.value)} style={{textAlign: 'center'}} required />
				<input type="submit" value="Join Room" />
			</form>

			<br />

			
			{ !state ? null :
				<Redir to="/home" content="Return to Main Menu" state={{username: state.username}}></Redir>
			}
		</>
	)
}
