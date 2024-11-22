import { io, Socket } from "socket.io-client";

// (from: https://stackoverflow.com/questions/72724973/how-to-pass-socket-connection-to-other-components-in-react-typescript)
export default class SocketInfo {
	public socket: Socket;
	public static inst: SocketInfo = new SocketInfo();
 
	private constructor() {
	   this.socket = io("http://localhost:3001");
	}
}