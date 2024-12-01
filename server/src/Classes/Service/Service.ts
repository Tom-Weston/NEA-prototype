
export default class Service {
	public static online: boolean;

	public static start(params: {}) {
		this.online = true;
		this.init(params);
	}

	static init(params: {}) {
		console.log("Online:");
		console.log(this);
	}
}