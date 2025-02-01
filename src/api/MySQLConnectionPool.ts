import { Pool, createPool } from 'mysql2/promise';
import { storage_config } from '../../config';

export class MySQLConnectionPool {
    private static _pool: Pool | null = null;

    private constructor() { }

    private static async initConnectionPool() {
        this._pool = await createPool({
            host: storage_config.DB?.HOST,
            user: storage_config.DB?.USER,
            password: storage_config.DB?.PASSWORD,
            database: storage_config.DB?.DATABASE,
            port: storage_config.DB?.PORT,
            waitForConnections: true,
            connectionLimit: 10,
            idleTimeout: 60000,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
        });

        console.debug('Database pool established successfully in MySQLConnectionPool.');
    }

    public static async getConnectionPool(): Promise<Pool> {
        if (!this._pool) {
            console.debug('Initializing database pool for the first time.');
            await MySQLConnectionPool.initConnectionPool();
        }

        return Promise.resolve(this._pool as Pool);
    }

}