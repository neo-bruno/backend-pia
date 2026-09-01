const jwt = require('jsonwebtoken');

const authConfig = {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES || '10h',
    algorithm: 'HS256'
};

module.exports = authConfig;