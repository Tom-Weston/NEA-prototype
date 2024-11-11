import { Link } from 'react-router-dom';

interface Props {
	to: string;
	content: string;
}

export default function Redir({to, content}: Props) {
	return (
		<>
			<div id='redir'><Link to={to}>{content}</Link></div>
		</>
	);
}