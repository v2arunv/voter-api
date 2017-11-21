const seedDB = (cdb) => {
  const dropQuery = `DROP KEYSPACE IF EXISTS dev`;
  const createKSQuery = `CREATE KEYSPACE dev WITH REPLICATION = {'class':'SimpleStrategy','replication_factor':1}`;
  const createTableQuery = `CREATE TABLE dev.votes ( id timeuuid PRIMARY KEY, postId int, userId int, score double )`;
  return cdb.execute(dropQuery, [])
  .then(result => {
    console.log('Keyspace dev dropped');
    return cdb.execute(createKSQuery, []);
  })
  .then((result) => {
    console.log('Keyspace dev created');
    return cdb.execute(createTableQuery, []);
  })
  .then(() => {
    console.log('Table dev.votes created');
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