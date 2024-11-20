import { Link } from 'react-router-dom';

interface Props {
	to: string;
	content: string;
	state: {
		username: string
	}
}

export default function Redir({to, content, state}: Props) {
	return (
		<>
			<div id='redir'><Link to={to} state={state}>{content}</Link></div>
		</>
	);
}