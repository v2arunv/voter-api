const model = require('./model');
const express = require('express');
const router = express.Router();
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
    if (score !== 1 && score !== -1) {
      return res.status(422).send('Invalid Score');
    }

    return Promise.all([
      redis.llen('topHundred'),
      redis.getAsync(postId)
    ])
    .spread((listLength, res) => {
      const currentScore = res == null ? 0 : res;
      const newScore = currentScore + score;
      const promises = [];
      // update upvote/downvote of a given post - might need LRU for this
      promises.push(redis.setAsync(postId, newScore));
      // update recent 100 transactions
      promises.push(redis.lpush('topHundred', `${postId}, ${score}`));
      return Promise.all(promises);
    })
    .spread(() => {
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
    return res.status(200).send([
      {
        postId: 123,
        score: 1,
      },{
        postId: 234,
        score: -1,
      }, {
        postId: 456,
        score: 1,
      }
    ]);
  })
  
  return router;
};