import Redis from 'ioredis';

class CacheService {
  private client: Redis | null = null;
  private memoryStore: Map<string, { val: string; expiresAt?: number }> = new Map();
  private isRedisConnected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Don't hang indefinitely if offline
        enableReadyCheck: false,
        lazyConnect: true,
      });

      this.client.connect().then(() => {
        this.isRedisConnected = true;
        console.log('✅ Connected to Redis successfully');
      }).catch(() => {
        console.log('⚠️ Redis server not reachable, using resilient In-Memory Cache fallback');
        this.isRedisConnected = false;
      });

      this.client.on('error', () => {
        this.isRedisConnected = false;
      });
    } catch {
      console.log('⚠️ Redis init failed, using In-Memory Cache fallback');
      this.isRedisConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isRedisConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch {
        // Fallback to memory
      }
    }

    const item = this.memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return item.val;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isRedisConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {
        // Fallback to memory
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryStore.set(key, { val: value, expiresAt });
  }

  async del(key: string): Promise<void> {
    if (this.isRedisConnected && this.client) {
      try {
        await this.client.del(key);
      } catch {
        // Fallback
      }
    }
    this.memoryStore.delete(key);
  }

  isConnected(): boolean {
    return this.isRedisConnected;
  }
}

export const cache = new CacheService();
