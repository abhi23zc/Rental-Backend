
import Redis from 'ioredis';

const redis = new Redis({
    host: 'redis-11918.c246.us-east-1-4.ec2.redns.redis-cloud.com',
    port: 11918       ,
    password: 'FT2kdVHDBZpvqcvCseGk2LbvMApYuXlA',
});


export default redis;
