import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import path from 'path';

// --------< IMPORTANT NOTE >-------------
// Until I get access to the MySQL database from home,
// I will be using this temporary local database using SQLite

export default class TempDB {
	// Only one dbInstance can exist at a time
	static dbInstance;

	static async init() {
		// Create database connection instance (if it doesn't already exist)
		if (!this.dbInstance) {
			this.dbInstance = await open({
				filename: path.resolve("./TEMPDB/Database.db"),
				driver: sqlite3.Database
			});

			console.log(`\n=====< [/] DATABASE INITIALISED >=====\n`);
			
			// Creating tables (if they don't exist)
			await this.dbInstance.exec(`
				CREATE TABLE IF NOT EXISTS Rooms (
					id STRING NOT NULL,
					title TEXT NOT NULL,
					inviteCode STRING NOT NULL,
					maxSize TINYINT NOT NULL,
					hostAccountID STRING NOT NULL,
					PRIMARY KEY(id)
				);

				CREATE TABLE IF NOT EXISTS Connection (
					id STRING,
					accountID STRING,
					PRIMARY KEY(id, accountID)
				);
			`);
		}
	}

	// Execute a query (default)
	// NOTE: Querys are split into the query ("INSERT ? INTO ?")
	// and the params are the variables to replace the '?' placeholders ([book, library])
	static async run(query, params = []) {
		return this.dbInstance.run(query, params)
	}

	// 
	static async get(query, params = []) {
		return this.dbInstance.get(query, params)
	}

	static async all(query, params = []) {
		return this.dbInstance.all(query, params);
	}
}