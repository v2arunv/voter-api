const express = require('express');
const _ = require('lodash');
const Promise = require('bluebird');
const app = express();
const http = require('http');
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

let portCounter = 0;
const tryAnotherPort = () => {
  const server = http.createServer(app).listen(config.DEFAULT_PORT[portCounter]);
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`${config.DEFAULT_PORT[portCounter]} is busy.`)
      tryAnotherPort();
    }
  });
  console.log(`Attempting Server Running on ${config.DEFAULT_PORT[portCounter]}`);
  portCounter++;
}

cdb.connect((err) => {
  if (err == null) {
    tryAnotherPort();
    if (config.ENABLE_SEED) {
      seed(cdb, redisClient);
    }
  }
})