const model = require('./model');
let requestCounter = 1;

module.exports = (app, cdb) => {
  app.post('/vote', (req, res) => {
    const score = req.body.score;
    const userId = req.body.userId;
    const postId = req.body.postId;
  
    if (score !== 1 && score !== -1) {
      return res.status(422).send('Invalid Score');
    }
    return res.status(200).send({
      success: true,
    });
  })
  
  app.get('/vote-counts', (req, res, next) => {
    const getVotesQuery = 'SELECT * FROM dev.votes'
    return cdb.execute(getVotesQuery, [])
    .then(result => {
      console.log(`Endpoint called ${requestCounter++} times!`);
      return res.status(200).send(result.rows);
    });
  })
  
  app.get('/vote-status', (req, res, next) => {
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
}