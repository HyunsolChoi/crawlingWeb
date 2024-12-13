// connectDB.js

const mysql = require('mysql2/promise');

// 데이터베이스 연결 설정
const dbConfig = {
    host: '113.198.66.75',
    port: 13109,
    user: 'sol',
    password: '9999',
    database: 'crawlDB'
};

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
