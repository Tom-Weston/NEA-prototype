import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import path from 'path';

// --------< IMPORTANT NOTE >-------------
// Until I get access to the MySQL database from home,
// I will be using this temporary local database using SQLite

export default class TempDB {
	// Only one dbInstance can exist at a time
	static dbInstance;

	// Setup DB
	static async init() {
		if (!this.dbInstance) {

			// Create database connection instance (if it doesn't already exist)
			this.dbInstance = await open({
				filename: path.resolve("./TEMPDB/Database.db"),
				driver: sqlite3.Database
			});

			console.log(`\n=====< [/] DATABASE INITIALISED >=====\n`);
			
			// Enables using WHERE statements with foreign keys
			// (from: https://stackoverflow.com/questions/15443913/sqlite3-foreign-key-constraint-failed)
			await TempDB.run("PRAGMA foreign_keys = 1;");

			// Creating tables (if they don't exist)
			// NOTE: id needs to be an integer to auto-increment (may be able to change when moving to MySQL)
			await this.dbInstance.exec(`
				CREATE TABLE IF NOT EXISTS Room (
					id INTEGER NOT NULL,
					title TEXT NOT NULL,
					inviteCode STRING NOT NULL,
					maxSize INTEGER NOT NULL,
					hostAccountID STRING NOT NULL,
					PRIMARY KEY(id)
				);

				CREATE TABLE IF NOT EXISTS Connection (
					roomID STRING,
					accountID STRING,
					PRIMARY KEY(roomID, accountID)
				);
			`);
		}
	}

	// Execute a query (default)
	// NOTE: Querys are split into the query ("INSERT ? INTO ?")
	// and the params are the variables to replace the '?' placeholders ([book, library])
	static async run(query: string, params: string[] = []) {
		return this.dbInstance.run(query, params)
	}

	// Get a record of data with a query (SELECT ...)
	static async get(query: string, params: string[] = []) {
		return this.dbInstance.get(query, params)
	}

	// Get all records in a table with a query (SELECT * ...)
	static async all(query: string, params: string[] = []) {
		return this.dbInstance.all(query, params);
	}
}