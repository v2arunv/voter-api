const seedDB = (cdb) => {
  const dropQuery = `DROP KEYSPACE IF EXISTS dev`;
  const createKSQuery = `CREATE KEYSPACE dev WITH REPLICATION = {'class':'SimpleStrategy','replication_factor':1}`;
  const createTableQuery = `CREATE TABLE dev.votes ( id timeuuid PRIMARY KEY, postId bigint, userId bigint, score bigint, createdAt timestamp )`;
  const createPostIDIndexQuery = 'CREATE INDEX post_index ON dev.votes (postId)';
  const createScoreIndexQuery = 'CREATE INDEX score_index ON dev.votes (score)';
  return cdb.execute(dropQuery, [])
  .then(result => {
    console.log('DB: Keyspace dev dropped');
    return cdb.execute(createKSQuery, []);
  })
  .then((result) => {
    console.log('DB: Keyspace dev created');
    return cdb.execute(createTableQuery, []);
  })
  .then(() => {
    console.log('DB: Table dev.votes created');
    return cdb.execute(createPostIDIndexQuery, []);
  })
  .then(() => {
    console.log('DB: Index post_index created');
    return cdb.execute(createScoreIndexQuery, []);
  })
  .then(() => {
    console.log('DB: Index score_index created');
  });
};

const seedRedis = (redisClient) => {
  return redisClient.flushall();
};

module.exports = (cdb, redisClient) => {
  return seedDB(cdb)
  .then(() => {
    return seedRedis(redisClient);
  });
};