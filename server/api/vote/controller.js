const model = require('./model');
const express = require('express');
const router = express.Router();
const _ = require('lodash');
const Promise = require('bluebird');
let requestCounter = 1;

module.exports = (cdb, redis) => {
  const saveVoteToDB = (cdb, payload) => {
    const query = `INSERT INTO dev.votes (id, postId, userId, score) values (now(), ${payload.postId},${payload.userId},${payload.score})`;
    return cdb.execute(query, [])
    .then((result) => {
      return result;
    });
  }


  router.post('/vote', (req, res, next) => {
    const score = parseInt(req.body.score, 10);
    const userId = req.body.userId;
    const postId = req.body.postId;
    let topHundredLength;
    if (score !== 1 && score !== -1) {
      return res.status(422).send('Invalid Score');
    }
    return redis.llen('topHundred').execAsync()
    .then((len) => {
      topHundredLength = len;
      return redis.get(postId).execAsync();
    })
    .then((getResult) => {
      console.log('Length of list = ',topHundredLength);
      console.log('Current Score = ', getResult[0]);
      const currentScore = getResult[0] == null ? 0 : getResult[0];
      const newScore = currentScore + score;
      const promises = [];
      // update upvote/downvote of a given post - might need LRU for this
      return redis.set(postId, newScore).execAsync();
    })
    .then(() => {
      // update recent 100 transactions
      return redis.lpush('topHundred', `${postId},${score}`).execAsync();
    })
    .then(() => {
      res.status(200).send({
        status: 'success',
      });
      return saveVoteToDB(cdb, {
        score,
        userId,
        postId
      });
    })
    .then((dbResult) => {
      console.log(`Updated ${postId} with score of ${score} by ${userId}`);
    });
  });
  
  router.get('/vote-counts', (req, res, next) => {
    const postiveVotesQuery = `SELECT sum(score) FROM dev.votes WHERE postId=${req.query.postId} and score=1 ALLOW FILTERING`;
    const negativeVotesQuery = `SELECT sum(score) FROM dev.votes WHERE postId=${req.query.postId} and score=-1 ALLOW FILTERING`;
    return Promise.all([
      cdb.execute(postiveVotesQuery, []),
      cdb.execute(negativeVotesQuery, [])
    ])
    .spread((up, down) => {
      console.log(`Endpoint called ${requestCounter++} times!`);
      return res.status(200).send({
        up,
        down,
      });
    });
  });
  
  router.get('/vote-status', (req, res, next) => {
    return redis.lrange('topHundred', 0, 100).execAsync()
    .then((range) => {
      // All redis results wrap the result in an array
      return res.status(200).send(_.map(range[0], (el) => {
        return {
          postId: el.substring(0, el.indexOf(',')),
          score: el.substring(el.indexOf(',') + 1, el.length),
        };
      }));
    });
  });

  return router;
};