import { io, Socket } from 'socket.io-client';
import { useState, useEffect, Dispatch, SetStateAction, FormEvent} from 'react';

import Redir from "./Redir";

const socketEvents = (socketData: Socket, setRoomData: Dispatch<SetStateAction<RoomData | undefined>>) => {
	const socket = socketData;
	// Log when connected
	socket.on("connect", () => {
		console.log("Connected to server");
	});

	socket.on("res: join-room", (data) => {
		setRoomData(data);
		console.log("Room Data: ");
		console.log(data);
		alert("TO ADD: \nCreate room endpoint to redirect to /room/{invCode}/")
	});
};

type RoomData = {
	title: string,
	question: string,
	options: string[]
}

export default function JoinRoom() {
	const [socket, setSocket] = useState<Socket | undefined>(undefined);
	const [room, setRoom] = useState("");
	const [/*roomData*/, setRoomData] = useState<RoomData>();

	function joinRoom(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()

		socket?.emit("req: join-room", room);
	}

	useEffect(() => {
		const socketData = io("http://localhost:3001");
		setSocket(socketData);
		
		socketEvents(socketData, setRoomData);

		// Cleanup on component unmount
		return () => {
			socketData.disconnect();
		};
	}, []);

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
