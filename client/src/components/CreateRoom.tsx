import { Dispatch, SetStateAction, useEffect, useState } from "react";

import Redir from "./Redir";
import { io, Socket } from "socket.io-client";

// Handles the client-server connection
const socketEvents = (socketData: Socket, setRoomData: Dispatch<SetStateAction<RoomData | undefined>>) => {
	const socket = socketData;
	// Log when connected
	socket.on("connect", () => {
		console.log("Connected to server");
	});

	// When room data is sent over (send to room)
	socket.on("res: join-room", (data) => {
		setRoomData(data);
		console.log("Room Data: ");
		console.log(data);
		console.warn("THIS IS NOT THE ACTUAL ROOM DATA FORMAT, please check the data recieved in JoinRoom.tsx")
		alert("TO ADD: \nCreate room endpoint to redirect to /room/{invCode}/")
	});
};

type RoomData = {
	title: string,
	question: string,
	options: string[]
}

interface FormInfo {
	template: string;
	roomSize: string;
}

export default function CreateRoom() {
	const [socket, setSocket] = useState<Socket | undefined>(undefined);
	const [formInfo, setFormInfo] = useState<FormInfo>({template: "", roomSize: ""})
	const [/*roomData*/, setRoomData] = useState<RoomData>();


	useEffect(() => {
		const socketData = io("http://localhost:3001");
		setSocket(socketData);
		
		socketEvents(socketData, setRoomData);

		// Cleanup on component unmount
		return () => {
			socketData.disconnect();
		};
	}, []);

	function updateFormInfo(e: React.ChangeEvent<HTMLInputElement>) {
		const {name, value} = e.target;
		setFormInfo((prev) => ({...prev, [name]: value}))
	}

	function createRoom(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		
		socket?.emit("req: create-room", formInfo);
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
				<input className="centre-text" type="text" name="roomSize" placeholder="Room Size" onChange={(e) => updateFormInfo(e)} required />
				
				<input type="submit" value="Create Room" />
			</form>

			<Redir to="/" content="Return to Main Menu"></Redir>
		</>
	)
}
