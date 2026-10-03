import { Pool } from 'pg';
import { config } from '../config/env';

class DatabaseClient {
  private static instance: Pool | null = null;
  private static isConnected = false;

  public static getPool(): Pool {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new Pool({
        host: config.postgres.host,
        port: config.postgres.port,
        user: config.postgres.user,
        password: config.postgres.password,
        database: config.postgres.database,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 3000,
      });

      DatabaseClient.instance.on('error', (err) => {
        console.warn('[PostgreSQL Pool Warning]:', err.message);
      });
    }

    return DatabaseClient.instance;
  }

  public static async testConnection(): Promise<boolean> {
    try {
      const pool = DatabaseClient.getPool();
      const res = await pool.query('SELECT NOW()');
      DatabaseClient.isConnected = true;
      console.log('[PostgreSQL Connected]:', res.rows[0].now);
      return true;
    } catch (err: any) {
      console.warn('[PostgreSQL Warning]: Unable to connect to database.', err.message);
      DatabaseClient.isConnected = false;
      return false;
    }
  }

  public static async close(): Promise<void> {
    if (DatabaseClient.instance) {
      await DatabaseClient.instance.end();
      DatabaseClient.instance = null;
      DatabaseClient.isConnected = false;
    }
  }
}

export default DatabaseClient;
