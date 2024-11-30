// React
import { useEffect, useState } from "react";
import { NavigateFunction, useLocation, useNavigate } from "react-router-dom";

// Socket
import { Socket } from "socket.io-client";

// Components
import Redir from "./Redir";
import SocketInfo from "./SocketInfo";

// Handles the client-server connection
function socketEvents (socketData: Socket, navigate: NavigateFunction, username: string) {
	const socket = socketData;

	// Log when connected
	socket.on("connect", () => {
		console.log(`Connected to server [${socket.id}]`);
	});

	// Send to room (when room is created)
	socket.on("res: join-room", (data) => {
		navigate(`/room/${data.inviteCode}`, {state: {host: true, username: username}})
	});
};

interface FormInfo {
	template: string;
	size: string;
}

export default function CreateRoom() {
	const socket = SocketInfo.inst.socket;
	const [formInfo, setFormInfo] = useState<FormInfo>({template: "", size: ""})
	const [username, setUsername] = useState<string>("username goes here")	

	const navigate = useNavigate();

	// Get username
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
		socketEvents(socket, navigate, username);
	}, [socket, navigate, username]);

	function updateFormInfo(e: React.ChangeEvent<HTMLInputElement>) {
		const {name, value} = e.target;
		setFormInfo((prev) => ({...prev, [name]: value}))
	}

	function createRoom(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		
		// Request to create the room
		// Then wait for "res: join-room" (see socketEvents() function)
		socket.emit("req: create-room", {roomInfo: formInfo, host: username});
	}

	return (
		<>
			<h1>Create Room</h1>
			<form onSubmit={(e) => createRoom(e)}>
				{/* Template Choice */}
				<div className="list-row">
					<span><input type="radio" name="template" value="Film" onChange={(e) => updateFormInfo(e)} required />Film</span>
					<span><input type="radio" name="template" value="Food" onChange={(e) => updateFormInfo(e)} required />Food</span>
				</div>

				{/* Room Size */}
				<input className="centre-text" type="text" name="size" placeholder="Room Size" onChange={(e) => updateFormInfo(e)} required />
				
				<input type="submit" value="Create Room" />
			</form>

			{ !state ? null :
				<Redir to="/home" content="Return to Main Menu" state={{username: username}}></Redir>
			}
			
		</>
	)
}
