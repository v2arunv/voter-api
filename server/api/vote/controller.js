const express = require('express');
const router = express.Router();
const _ = require('lodash');
const Promise = require('bluebird');
let requestCounter = 1;

module.exports = (cdb, redis) => {
  const throttledTrim = _.throttle(() => { 
    return redis.ltrim('topHundred', 0, 100)
    .execAsync()
    .then(() => {
      console.log('LOG: Transactions Trimmed');
    });
  }, 1000);

  const saveVoteToDB = (cdb, payload) => {
    const query = `INSERT INTO dev.votes (id, postId, userId, score, createdAt) values (now(), ${payload.postId},${payload.userId},${payload.score}, toTimestamp(now()))`;
    return cdb.execute(query, [])
    .then((result) => {
      return result;
    });
  };

  const generateNewScore = (currentScore, newScore) => {
    let upvotes = currentScore.substring(0, currentScore.indexOf(','));
    let downvotes = currentScore.substring(currentScore.indexOf(',') + 1, currentScore.length);
    if (newScore == 1) {
      upvotes ++;
    } else if (newScore == -1) {
      downvotes ++;
    }
    return `${upvotes},${downvotes}`;
  };

  const splitValue = (score) => {
    return [
      parseInt(score.substring(0, score.indexOf(',')), 10),
      parseInt(score.substring(score.indexOf(',') + 1, score.length), 10),
    ];
  };

  router.post('/vote', (req, res, next) => {
    let topHundredLength;
    const score = parseInt(req.body.score, 10);
    const userId = req.body.userId;
    const postId = req.body.postId;
    if (
      postId == null || 
      userId == null ||
      score == null ||
      (score !== 1 && score !== -1)
    ) {
      console.log(`INVALID REQUEST: [postId: ${postId}, userId: ${userId}, score: ${score}]`);
      return res.status(422).send('Malformed Parameters. Please try again')
    }
    console.log(`VOTE: [postId: ${postId}, userId: ${userId}, score: ${score}]`);
    return redis.get(postId).execAsync()
    .then((getResult) => {
      const currentScore = getResult[0] == null ? '0,0' : String(getResult[0]);
      const newScore = generateNewScore(currentScore, score);
      // update upvote/downvote of a given post - might need LRU for this
      return redis
        .set(postId, newScore)
        .expire(postId, 10)
        .lpush('topHundred', `${postId},${score}`)
        .execAsync();
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
      console.log(`DB UPDATE: [postId: ${postId}, userId: ${userId}, score: ${score}]`);
      return throttledTrim();
      // TODO: Have another method called throttledSync() which syncs the DB with the Redis cache
    })
    .catch((e) => {
      console.log('ERROR:', e);
      return res.status(500).send(e);
    });
  });
  
  router.get('/vote-counts', (req, res, next) => {
    const postId = _.get(req, 'query.postId', null);
    console.log(`VOTE COUNTS: [postId: ${postId}]`);
      // try to get vote counts from Redis
    return redis.get(postId).execAsync()
    .then((val) => {
      // if redis lookup is a hit, respond immediately
      if (val[0] != null) {
        const redisValues = splitValue(val[0]);
        return res.status(200).send({
          upvotes: redisValues[0],
          downvotes: redisValues[1],
        });
      }
      //if redisk lookup is not a hit, query from database
      const postiveVotesQuery = `SELECT sum(score) FROM dev.votes WHERE postId=${postId} and score=1 ALLOW FILTERING`;
      const negativeVotesQuery = `SELECT sum(score) FROM dev.votes WHERE postId=${postId} and score=-1 ALLOW FILTERING`;
      return Promise.all([
        cdb.execute(postiveVotesQuery, []),
        cdb.execute(negativeVotesQuery, [])
      ])
      .spread((up, down) => {
        console.log(`Endpoint called ${requestCounter++} times!`);
        const upvotes = up.rows[0]['system.sum(score)'];
        const downvotes = down.rows[0]['system.sum(score)'];
        res.status(200).send({
          upvotes,
          downvotes,
        });
        // Store this is redis again, since it was queried for once
        return redis.set(postId, `${upvotes},${downvotes}`).execAsync();
      });
    });
  });
  
  router.get('/vote-status', (req, res, next) => {
    console.log(`VOTE STATUS`);
    return redis.lrange('topHundred', 0, 100).execAsync()
    .then((range) => {
      // All redis results wrap the result in an array
      return res.status(200).send(_.map(range[0], (el) => {
        const vals = splitValue(el);
        return {
          postId: vals[0],
          score: vals[1],
        };
      }));
    });
  });

  return router;
};