const defaultConstants = require('./constants');
const _ = require('lodash');

const getConstants = () => {
    const newConfig = _.reduce(defaultConstants, (acc, v, k) => {
        if (_.includes(Object.keys(process.env), k)) {
            acc[k] = process.env[v];
        }
        else {
            acc[k] = v;
        }
        return acc;
    }, {});
    return newConfig;
};

module.exports = getConstants();
