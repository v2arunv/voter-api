const seedDB = (cdb) => {
  const createQuery = `create keyspace dev with replication = {'class':'SimpleStrategy','replication_factor':1};`
  return cdb.execute(createQuery, [])
  .then(result => {
    console.log(result);
  });
}

const seedRedis = (redisClient) => {

};

module.exports = (cdb, redisClient) => {
  seedDB(cdb);
  seedRedis(redisClient);
}