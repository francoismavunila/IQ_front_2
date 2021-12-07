var jwt = require('jsonwebtoken');

var genAccess = function generateAccessToken(username){
    return jwt.sign(username, process.env.JWT_HASH, { expiresIn: '1800s' });
}

module.exports = genAccess;