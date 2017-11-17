const express = require('express');
const _ = require('lodash');
const Promise = require('bluebird');
const app = express();
const cassandra = require('cassandra-driver');
const redis = require('redis')
const config = require('./config');
const seed = require('./services/seed');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

const cdb = new cassandra.Client({ contactPoints: [config.DB_HOST] });
const redisClient = redis.createClient({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
}); 
const voteAPI = require('./api/vote/controller')(app, cdb, redisClient);


cdb.connect((err) => {
  if (err == null) {
    app.listen(3000, () => console.log('Example app listening on port 3000!'))
    if (config.ENABLE_SEED) {
      seed(cdb, redisClient);
    }
  }
})