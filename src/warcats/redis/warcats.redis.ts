import { RedisClientType } from '@redis/client';
import { createClient } from 'redis';

export interface IRedisProvider {
  pub: RedisClientType;
  sub: RedisClientType;
}

export const makeRedisProvider = (key: string) => {
  return {
    useFactory: async () => {
      const pub = createClient({ url: process.env.REDIS_URL });
      const sub = pub.duplicate();

      await Promise.all([pub.connect(), sub.connect()]);

      return { pub, sub };
    },
    provide: key,
  };
};
