// React
import { useState, useEffect, FormEvent} from 'react';
import { NavigateFunction, useNavigate } from 'react-router-dom';

// Socket
import { io, Socket } from 'socket.io-client';

// Components
import Redir from "./Redir";

const socketEvents = (socketData: Socket , navigate: NavigateFunction) => {
	const socket = socketData;
	// Log when connected
	socket.on("connect", () => {
		console.log("Connected to server");
	});

	// When room data is sent over (send to room)
	socket.on("res: join-room", (data) => {
		console.log("Room Data: ");
		console.log(data);

		navigate(`/room/${data.inviteCode}`, { state: { roomData: data} })
	});
};


export default function JoinRoom() {
	const [socket, setSocket] = useState<Socket>(io());
	const [room, setRoom] = useState("");

	const navigate = useNavigate();

	// The socket is saved as a state so that it can
	// be disconnected when the user redirects
	useEffect(() => {
		const socketData = io("http://localhost:3001")
		setSocket(socketData);

		socketEvents(socketData, navigate);

		// Cleanup on component unmount
		return () => {
			socketData.disconnect();
		};
	}, [navigate]);
	
	// Called when the form is submitted
	function joinRoom(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()

		socket.emit("req: join-room", room);
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
			<Redir to="/" content="Return to Main Menu"></Redir>
		</>
	)
}
