import mysql from 'mysql2/promise';

// I HAVE NO IDEA IF THIS WORKS OR NOT
// I NEED TO WAIT FOR THE DB TO BE AVAILABLE FIRST

export default class DB {
    private static connection: mysql.Connection;

    static async init() {
        this.connection = await mysql.createConnection({
            host: 'computing.gfmat.org',
            port: 3306,
            user: '2023_T_Weston',
            password: '3AkVWNYAJg6x',
            database: 'DecisionDB',
            // MAY NOT BE RIGHT (check with CS class pc build)

            // [NEED TO UPDATE WITH CLASS PC BUILD]
            // ["ssl-mode"]: 'PREFERRED',
        });
    }

    static async get(query: string) {

        try {
            const res = await this.connection.query(query);

            return res

        } catch (err) {
            console.log(err);
        }
    }

    static async QueryDB(query: string) {
        if (query.includes("SELECT")) {
            this.get(query);
        }
    }
}