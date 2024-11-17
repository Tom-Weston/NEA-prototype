import { useState, useEffect } from "react";
import { useParams } from "react-router-dom"

import { io, Socket } from "socket.io-client";

// Handles the client-server connection
const socketEvents = (socketData: Socket, setRoomData: React.Dispatch<React.SetStateAction<RoomData>>) => {
	const socket = socketData;

	// Log when connected
	socket.on("connect", () => {
		console.log("Connected to server");
	});

	// When the next question's data is sent over
	socket.on("res: room-data", (data) => {
		console.log("Room Data: ");
		console.log(data);

		setRoomData(data);
	});
};

type RoomData = {
	title: string,
	question: {
		title: string,
		options: string[]
	}
}

export default function Room() {
	const [socket, setSocket] = useState<Socket>(io());
	const [roomData, setRoomData] = useState<RoomData>({title: "Nothing!", question: {title: "Absolutely nothing!", options: ["nothing 1", "nothing 2"]}});

	const { id } = useParams();
	
	// Setup the socket connection
	useEffect(() => {
		const socketData = io("http://localhost:3001");
		setSocket(socketData);

		socketEvents(socketData, setRoomData);

		// Cleanup on component unmount
		return () => {
			socketData.disconnect();
		};
	}, []);

	// Get room data when user joins the room
	useEffect(() => {
		console.log("Requesting data")
		socket.emit("req: room-data", id)
	}, [socket, id]);

	return (
		<>
			<div className="centre-text">Room {id}!</div>
			<div className="centre-text">
				{(!roomData) ? <h1>no data</h1> :
				<>
					<h1>{roomData.title}</h1>
					<h2>{roomData.question.title}</h2>
					<div className="list-col">
						{roomData.question.options.map((option => <button style={{width: "200px"}}>{option}</button> ))}
					</div>
				</>}
				
			</div>
		</>
	);
}