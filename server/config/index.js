const defaultConstants = require('./constants');
const _ = require('lodash');

const getConstants = () => {
    return _.reduce(defaultConstants, (acc, v, k) => {
        if (_.includes(Object.keys(process.env), k)) {
            acc[k] = process.env[k];
        }
        else {
            acc[k] = v;
        }
        return acc;
    }, {});
};

module.exports = getConstants();
