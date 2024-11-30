import { Link } from 'react-router-dom';

type onClickFunction = () => void;
interface Props {
	onClick?: onClickFunction;
	to: string;
	content: string;
	state: {
		username: string
	}
}

export default function Redir({to, content, state, onClick}: Props) {
	return (
		<>
			<div id='redir'><Link onClick={() => (onClick) ? onClick() : ""} to={to} state={state}>{content}</Link></div>
		</>
	);
}