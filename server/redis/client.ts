import Redis from 'ioredis';
import { config } from '../config/env';

class RedisManager {
  private static client: Redis | null = null;
  private static isAvailable = false;

  public static getClient(): Redis {
    if (!RedisManager.client) {
      RedisManager.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 5) {
            return null; // Stop retrying after 5 attempts if Docker isn't running
          }
          return Math.min(times * 500, 2000);
        },
      });

      RedisManager.client.on('connect', () => {
        console.log('[Redis Connected]: Ready on', `${config.redis.host}:${config.redis.port}`);
        RedisManager.isAvailable = true;
      });

      RedisManager.client.on('error', (err) => {
        if (!RedisManager.isAvailable) {
          console.warn('[Redis Notice]: Redis container not reachable. Using fallback in-memory state store.');
        } else {
          console.warn('[Redis Error]:', err.message);
        }
        RedisManager.isAvailable = false;
      });
    }

    return RedisManager.client;
  }

  public static async init(): Promise<boolean> {
    const client = RedisManager.getClient();
    try {
      await client.connect();
      RedisManager.isAvailable = true;
      return true;
    } catch {
      RedisManager.isAvailable = false;
      return false;
    }
  }

  public static isConnected(): boolean {
    return RedisManager.isAvailable;
  }
}

export default RedisManager;
