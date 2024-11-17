// React
import { useEffect, useState } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";

// Socket
import { io, Socket } from "socket.io-client";

// Components
import Redir from "./Redir";

// Handles the client-server connection
const socketEvents = (socketData: Socket, navigate: NavigateFunction) => {
	const socket = socketData;

	// Log when connected
	socket.on("connect", () => {
		console.log("Connected to server");
	});

	// Send to room (when room is created)
	socket.on("res: join-room", (data) => {
		navigate(`/room/${data.inviteCode}`)
	});
};

interface FormInfo {
	template: string;
	size: string;
}

export default function CreateRoom() {
	const [socket, setSocket] = useState<Socket>(io("http://localhost:3001"));
	const [formInfo, setFormInfo] = useState<FormInfo>({template: "", size: ""})
	
	// Redirect function (for to-be-created room)
	const navigate = useNavigate();

	// Setup the socket connection
	useEffect(() => {
		const socket = io("http://localhost:3001");
		setSocket(socket);

		socketEvents(socket, navigate);

		// Cleanup on component unmount
		return () => {
			socket.disconnect();
		};
	}, [navigate]);

	function updateFormInfo(e: React.ChangeEvent<HTMLInputElement>) {
		const {name, value} = e.target;
		setFormInfo((prev) => ({...prev, [name]: value}))
	}

	function createRoom(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		
		// Request to create the room
		// Then wait for "res: join-room" (see socketEvents() function)
		socket.emit("req: create-room", formInfo);
	}

	return (
		<>
			<h1>Create Room</h1>
			<form onSubmit={(e) => createRoom(e)}>
				{/* Template Choice */}
				<div>
					<input type="radio" name="template" value="Film" onChange={(e) => updateFormInfo(e)} required />Film
					<input type="radio" name="template" value="Food" onChange={(e) => updateFormInfo(e)} required />Food
				</div>

				{/* Room Size */}
				<input className="centre-text" type="text" name="size" placeholder="Room Size" onChange={(e) => updateFormInfo(e)} required />
				
				<input type="submit" value="Create Room" />
			</form>

			<Redir to="/" content="Return to Main Menu"></Redir>
		</>
	)
}
