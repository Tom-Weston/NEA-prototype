import mysql from 'mysql2/promise';

// I HAVE NO IDEA IF THIS WORKS OR NOT
// I NEED TO WAIT FOR THE DB TO BE AVAILABLE FIRST

export default class DB {
    static async init() {
        this.connection = await mysql.createConnection({
            host: 'computing.gfmat.org',
            port: 3306,
            user: '2023_T_Weston',
            password: '3AkVWNYAJg6x',
            database: 'DecisionDB'
        });
    }

    static async get(query) {

        try {
            const res = await connection.query(query);

            return res

        } catch (err) {
            console.log(err);
        }
    }

    static async queryDB(query) {
        if (query.contains("SELECT")) {
            this.get(query);
        }
    }
}