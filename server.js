const https = require('https');
const fs = require('fs');
const express = require('express');
const authAPI = require('./Control/authAPI'); // authAPI 라우트
const jobsAPI = require('./Control/jobsAPI'); // jobsAPI 라우트
const applicationsAPI = require('./Control/applicationsAPI');
const bookmarksAPI = require('./Control/bookmarksAPI');
const recommendationsAPI = require('./Control/recommendationsAPI');
const authenticate = require('./Middlewares/authenticate'); // 인증 미들웨어 추가
const { networkInterfaces } = require('node:os');
const { swaggerUi, specs } = require("./Swagger/swagger")

const app = express();

// SSL 인증서 파일 로드
const options = {
    key: fs.readFileSync('./HTTPS-KEY/server.key'), // private key 경로
    cert: fs.readFileSync('./HTTPS-KEY/server.cert') // certificate 경로
};

// Middlewares 설정
app.use(express.json()); // JSON 요청 파싱
app.use(express.urlencoded({ extended: true }))

// 인증 미들웨어 설정 (글로벌)
app.use((req, res, next) => {
    // 회원가입 및 로그인 경로는 인증 예외 처리
    const nonAuthPaths = ['/auth/register', '/auth/login', '/api-docs'];
    if (nonAuthPaths.some(path => req.path.startsWith(path))) {
        return next();
    }
    authenticate(req, res, next); // 다른 경로는 인증 필요
});

app.get('/', (req, res) => {
    res.redirect('/auth/login');
    // 루트에는 아무 내용이 없으므로 로그인 api 로 redirect 함
});

// Swagger UI 연결
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
console.log('Swagger UI is available at https://113.198.66.75:17109/api-docs');

// authAPI 연결
app.use('/auth', authAPI);

// jobsAPI 연결
app.use('/jobs', jobsAPI);

// applicationsAPI 연결
app.use('/applications', applicationsAPI);

// bookmarksAPI 연결
app.use('/bookmarks', bookmarksAPI);

// recommendationsAPI 연결
app.use('/recommendations', recommendationsAPI);

// 네트워크 인터페이스에서 IP 주소 가져오기
function getIPAddress() {
    const interfaces = networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const netInterface of interfaces[name]) {
            if (netInterface.family === 'IPv4' && !netInterface.internal) {
                return netInterface.address; // 외부 네트워크 IPv4 주소 반환
            }
        }
    }
    return 'localhost'; // 기본값
}

// HTTPS 서버 실행, 현재 호스트 주소 반영
https.createServer(options, app).listen(443, () => {
    const host = getIPAddress();
    console.log(`Server is running on https://${host}:443`);
});
