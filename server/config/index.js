const defaultConstants = require('./constants');
const _ = require('lodash');

const requireEval = [
    'ENABLE_SEED',
    'DEFAULT_PORT'
];

const getConstants = () => {
    return _.reduce(defaultConstants, (acc, v, k) => {
        if (_.includes(Object.keys(process.env), k)) {
            if (_.includes(requireEval, k)) {
                acc[k] = eval(process.env[k]);
            } else {
                acc[k] = process.env[k];
            }
        }
        else {
            acc[k] = v;
        }
        return acc;
    }, {});
};

module.exports = getConstants();
