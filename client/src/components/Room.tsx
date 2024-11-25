// React
import { useState, useEffect } from "react";
import { NavigateFunction, useLocation, useNavigate, useParams } from "react-router-dom"

// Socket
import { Socket } from "socket.io-client";

// Components
import Redir from "./Redir";
import SocketInfo from "./SocketInfo";

// Handles the client-server connection
function socketEvents(socket: Socket, username: string, navigate: NavigateFunction, setRoomData: React.Dispatch<React.SetStateAction<RoomData>>) {

	// Log when connected
	socket.on("connect", () => {
		console.log(`Connected to server [${socket.id}]`);
	});

	// When the next question's data is sent over
	socket.on("res: room-data", (data) => {
		console.log("Room Data: ");
		console.log(data);

		setRoomData(data);
	});

	socket.on("res: close-room", (analytics) => {
		console.log("Closed room!")

		// NOTE: If this doesn't work, parse in inviteCode into params instead
		navigate(window.location.href + "/analytics", {state: {username: username, analytics: analytics}})
	})
};

type RoomData = {
	title: string,
	question: {
		title: string,
		options: string[]
	},
	lastQuestion: boolean
}

export default function Room() {
	const socket = SocketInfo.inst.socket;
	const [roomData, setRoomData] = useState<RoomData>({title: "Nothing!", question: {title: "Absolutely nothing!", options: ["nothing 1", "nothing 2"]}, lastQuestion: false});
	const [isHost, setIsHost] = useState<boolean>(false);

	// Change to accountID post-prototype
	const [username, setUsername] = useState<string>("username goes here");

	const { roomCode } = useParams();

	// Get username
	const { state } = useLocation();
	const navigate = useNavigate();
	useEffect(() => {
		if (state?.username) {
			setUsername(state.username);
		} else {
			// If no 'username' in state, redirect to login page (/)
			navigate("/");
		}
	}, [state, navigate])

	// Setup the socket connection
	// NOTE: Adding 'socket' as a dependency recursively lags the
	// entire PC to unresponsiveness
	useEffect(() => {
		socketEvents(socket, username, navigate, setRoomData);
	}, [socket]);

	// Get room data when user joins the room
	useEffect(() => {
		console.log("Requesting data")
		socket.emit("req: room-data", roomCode)
	}, [socket, roomCode]);

	// Check if user is host, and if so show host options
	useEffect(() => {
		setIsHost(state.host);
	}, [state])

	function voteForOption(e: React.MouseEvent<HTMLButtonElement>) {
		// Get value from event element
		// (from: https://stackoverflow.com/questions/42066421/property-value-does-not-exist-on-type-eventtarget)
		const option = (e.target as HTMLButtonElement).value;

		// Send vote over to server
		// (need to make sure votes aren't duplicates)
		socket.emit("req: submit-vote", {room: roomCode, option: option, name: username});
	}

	function nextQuestion() {
		console.log("getting next question");
		socket.emit("req: next-question", {room: roomCode, name: username});
	}

	function closeRoom() {
		console.log("Closing room")
		socket.emit("req: close-room", {room: roomCode, name: username})
	}

	return (
		<>
			<div className="centre-text">{roomCode}</div>
			{(!roomData) ? <h1>no data</h1> :
			<>
				<div className="centre-text">
					<h1>{roomData.title}</h1>
					<h2>{roomData.question.title}</h2>
					<div className="list-col">
						{roomData.question.options.map((option =>
							<button value={option} onClick={(e) => voteForOption(e)} key={option} style={{width: "200px"}}>{option}</button>
						))}
					</div>
				</div>
				
				{(isHost) ?
				// If the host, display host options
				<div className="list-row" style={{marginTop: "20px"}}>
					{(roomData.lastQuestion) ? null :
						<button onClick={() => nextQuestion()}>Next Question</button>
					}
					<button onClick={() => closeRoom()}>Close Room</button>
				</div>
				:
				// Otherwise display leave button
				// [NEED TO IMPLEMENT]
				!state ? null : <Redir to="/" content="Return to Main Menu" state={{username: username}}></Redir>
				}
			</>
			}
		</>
	);
}