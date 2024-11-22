// React
import { useState, useEffect, FormEvent} from 'react';
import { NavigateFunction, useLocation, useNavigate } from 'react-router-dom';

// Socket
import { Socket } from 'socket.io-client';

// Components
import Redir from "./Redir";
import SocketInfo from './SocketInfo';

const socketEvents = (socketData: Socket , navigate: NavigateFunction) => {
	const socket = socketData;
	// Log when connected
	socket.on("connect", () => {
		console.log("Connected to server");
	});

	// When room data is sent over (send to room)
	socket.on("res: join-room", (data) => {
		navigate(`/room/${data.inviteCode}`, {state: {host: false}})
	});
};


export default function JoinRoom() {
	const [socket, setSocket] = useState<Socket>();
	const [room, setRoom] = useState("");

	const navigate = useNavigate();
	const { state } = useLocation();

	// If no 'username' in state, redirect to login page (/)
	useEffect(() => {
		if (!state?.username) {
			navigate("/");
		}
	}, [state, navigate])
	
	// Setup the socket connection
	useEffect(() => {
		const socket = SocketInfo.inst.socket;
		setSocket(socket);

		socketEvents(socket, navigate);
	}, [navigate]);

	useEffect(() => {
		if (socket) {
			console.log(socket.id);
		}
	}, [socket])
	
	// Called when the form is submitted
	function joinRoom(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()

		// Request to join the room
		// Then wait for "res: join-room" (see socketEvents() function)
		socket?.emit("req: join-room", room);
	}

	return (
		<>
			<h1>Join Room</h1>

			{/* Form info (invite code) for joining a room */}
			<form onSubmit={(e) => joinRoom(e)}>
				<input name="inviteCode" type="text" placeholder="Invite Code" onChange={(e) => setRoom(e.target.value)} required />
				<input type="submit" value="Join Room" />
			</form>

			<br />

			
			{ !state ? null :
				<Redir to="/home" content="Return to Main Menu" state={{username: state.username}}></Redir>
			}
		</>
	)
}
