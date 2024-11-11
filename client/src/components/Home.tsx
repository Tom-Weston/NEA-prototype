import Redir from './Redir';

export default function Home() {
	return (
		<>
			<h1 >Home</h1>
			<div className="list-row">
				<Redir to="/create" content="Create Room" />
				<Redir to="/join" content="Join Room" />
			</div>
		</>
	)
}
