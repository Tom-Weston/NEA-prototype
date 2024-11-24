// React
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Components
import SocketInfo from "./SocketInfo";

export default function Home() {
	const socket = SocketInfo.inst.socket;
	const [username, setUsername] = useState<string>()

	const navigate = useNavigate();

	useEffect(() => {
		if (socket) {
			console.log(socket.id);
		}
	}, [socket])

	function updateUsername(e: React.ChangeEvent<HTMLInputElement>) {
		const {value} = e.target;
		setUsername(value);
	}

	function processAccount(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();

		navigate("/home", {state: {username: username}})
	}

	return (
		<>
			<h1>Login</h1>
			<form onSubmit={(e) => processAccount(e)} className='list-col'>
				<input type="text" name="name" placeholder="Username" required onChange={(e) => updateUsername(e)} style={{textAlign: 'center'}} />
				<input type="submit" value="Login" style={{width: "178px"}} />
			</form>
		</>
	)
}
