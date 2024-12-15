const mysql = require('mysql2/promise');
require('dotenv').config();

// 데이터베이스 연결 설정

const dbConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT), // 문자열을 숫자로 변환
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
};

module.exports = dbConfig;

// 데이터베이스 연결을 반환하는 함수
async function getConnection() {
    try {
        return await mysql.createConnection(dbConfig);
    } catch (error) {
        console.error('데이터베이스 연결 중 오류:', error.message);
        throw error;
    }
}

module.exports = { getConnection };
