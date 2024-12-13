const { SECRET_KEY } = require('../Utils/config');
const jwt = require('jsonwebtoken');
const {error} = require('../View/response');

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return error(res, '인증이 필요합니다', null, 401);
    }

    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, SECRET_KEY); // req.user 에 JWT 내용 저장
        next();
    } catch (err) {
        return error(res, '유효하지 않은 토큰입니다.', null, 403);
    }
};

module.exports = authenticate;
