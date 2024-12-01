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
			console.log(`Socket connected [${socket.id}]`);
		}
	}, [socket])

	// Update form value (triggered on username input change)
	function updateUsername(e: React.ChangeEvent<HTMLInputElement>) {
		const {value} = e.target;
		setUsername(value);		// Sets 'username' to new value
	}

	// Triggered when the form is submitted
	function processAccount(e: FormEvent<HTMLFormElement>) {
		// Prevents refreshing the page
		e.preventDefault();

		// Redirect to home page with username in state
		navigate("/home", {state: {username: username}})
	}

	return (
		<>
			<h1>Login</h1>
			<form onSubmit={(e) => processAccount(e)} className='list-col'>
				<input type="text" name="name" placeholder="Username" required onChange={(e) => updateUsername(e)} />
				<input type="submit" value="Login" />
			</form>
		</>
	)
}
