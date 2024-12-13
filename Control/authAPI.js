const express = require('express');
const { SECRET_KEY } = require('../Utils/config');
const jwt = require('jsonwebtoken');
const {success, error} = require('../View/response');
const {executeQuery} = require("../Model/executeDB");

const generateToken = (userId) => {
    return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '1h' });
};

const router = express.Router();
const REFRESH_SECRET_KEY = 'your_refresh_secret_key';

// 이메일 정규식
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @swagger
 * paths:
 *  /auth/register:
 *    post:
 *      summary: "회원 가입"
 *      description: "이메일, 비밀번호, 이름을 통해 회원을 등록합니다. (예시용 이메일로는 가입이 불가합니다)"
 *      tags: [Auth]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *                  description: "사용자의 이메일"
 *                  example: "user@example.com"
 *                password:
 *                  type: string
 *                  description: "사용자의 비밀번호 (영어, 숫자, !, @만 허용)"
 *                  example: "Password123!"
 *                name:
 *                  type: string
 *                  description: "사용자의 이름 (한글, 영어, 숫자만 허용)"
 *                  example: "홍길동123"
 *      responses:
 *        201:
 *          description: "회원 가입 성공"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "success"
 *                  message:
 *                    type: string
 *                    example: "회원 가입 성공"
 *                  data:
 *                    type: object
 *                    properties:
 *                      value:
 *                        type: string
 *                        example: "user@example.com"
 *        400:
 *          description: "잘못된 요청"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "error"
 *                  message:
 *                    type: string
 *                  code:
 *                    type: integer
 *                    example: 400
 *              examples:
 *                allFieldsRequired:
 *                  summary: "모든 필드를 입력하지 않음"
 *                  value:
 *                    status: "error"
 *                    message: "모든 필드를 입력하세요."
 *                    code: 400
 *                invalidEmail:
 *                  summary: "유효하지 않은 이메일 형식"
 *                  value:
 *                    status: "error"
 *                    message: "유효하지 않은 이메일 형식입니다."
 *                    code: 400
 *                invalidName:
 *                  summary: "유효하지 않은 이름 형식"
 *                  value:
 *                    status: "error"
 *                    message: "이름은 한글, 영어, 숫자만 입력 가능합니다."
 *                    code: 400
 *                invalidPassword:
 *                  summary: "유효하지 않은 비밀번호 형식"
 *                  value:
 *                    status: "error"
 *                    message: "비밀번호는 영어, 숫자, !, @만 포함할 수 있습니다."
 *                    code: 400
 *        409:
 *          description: "이메일 중복 오류"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "error"
 *                  message:
 *                    type: string
 *                    example: "이미 등록된 이메일입니다."
 *                  code:
 *                    type: integer
 *                    example: 409
 *        500:
 *          description: "서버 오류"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "error"
 *                  message:
 *                    type: string
 *                    example: "회원 가입 실패"
 *                  code:
 *                    type: integer
 *                    example: 500
 *                  error:
 *                    type: string
 *                    example: "에러 메세지"
 *      security: [] # 보안 비활성화
 */

/**
 * 회원가입 API
 *
 * @param {Object} req - 요청 객체
 * @param {Object} req.body - 요청 본문
 * @param {string} req.body.email - 사용자 이메일
 * @param {string} req.body.password - 사용자 비밀번호
 * @param {string} req.body.name - 사용자 이름
 * @param {Object} res - 응답 객체
 * @returns {Object} 응답 객체
 */
router.post('/register', async (req, res) => {
    const { email, password, name } = req.body;

    // 요청 데이터 검증
    if (!email || !password || !name) {
        return error(res, '모든 필드를 입력하세요.', null, 400);
    }

    // 이메일 형식 검증, 예시 이메일 회원 가입 금지
    if (!emailRegex.test(email) || email === "user@example.com") {
        return error(res, '유효하지 않은 이메일 형식입니다.', null, 400);
    }

    // 이름 형식 검증
    const nameRegex = /^[a-zA-Z가-힣0-9]+$/;
    if (!nameRegex.test(name)) {
        return error(res, '이름은 한글, 영어, 숫자만 입력 가능합니다.', null, 400);
    }

    // 비밀번호 형식 검증
    const passwordRegex = /^[a-zA-Z0-9!@]+$/;
    if (!passwordRegex.test(password)) {
        return error(res, '비밀번호는 영어, 숫자, !, @만 포함할 수 있습니다.', null, 400);
    }

    // 비밀번호 암호화
    const hashedPassword = Buffer.from(password).toString('base64');

    try {
        const existingUser = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser?.[0]?.length > 0) {
            return error(res, '이미 등록된 이메일입니다.', null, 409);
        }

        await executeQuery(
            'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
            [email, hashedPassword, name]
        );
        success(res, '회원 가입 성공', email, null, true);
    } catch (err) {
        error(res, '회원 가입 실패', err, 500);
    }
});


/**
 * @swagger
 * paths:
 *  /auth/login:
 *    post:
 *      summary: "로그인"
 *      description: "이메일과 비밀번호를 사용하여 로그인합니다."
 *      tags: [Auth]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *                  description: "사용자의 이메일"
 *                  example: "user@example.com"
 *                password:
 *                  type: string
 *                  description: "사용자의 비밀번호"
 *                  example: "Password123!"
 *      responses:
 *        200:
 *          description: "로그인 성공"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "success"
 *                  message:
 *                    type: string
 *                    example: "로그인 성공"
 *                  data:
 *                    type: object
 *                    properties:
 *                      accessToken:
 *                        type: string
 *                        description: "사용자를 인증하기 위한 액세스 토큰"
 *                        example: "eyJhbGciOiJIUzI1NiIsInR..."
 *                      refreshToken:
 *                        type: string
 *                        description: "토큰 갱신을 위한 리프레시 토큰"
 *                        example: "eyJhbGciOiJIUzI1NiIsInR..."
 *        400:
 *          description: "잘못된 요청"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "error"
 *                  message:
 *                    type: string
 *                  code:
 *                    type: integer
 *                    example: 400
 *              examples:
 *                missingFields:
 *                  summary: "필수 필드 누락"
 *                  value:
 *                    status: "error"
 *                    message: "이메일과 비밀번호를 입력하세요."
 *                    code: 400
 *                invalidCredentials:
 *                  summary: "잘못된 인증 정보"
 *                  value:
 *                    status: "error"
 *                    message: "이메일 또는 비밀번호가 잘못되었습니다."
 *                    code: 400
 *        500:
 *          description: "서버 오류"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "error"
 *                  message:
 *                    type: string
 *                    example: "로그인 실패"
 *                  code:
 *                    type: integer
 *                    example: 500
 *                  error:
 *                    type: string
 *                    example: "에러 메세지"
 *      security: [] # 보안 비활성화
 */

/**
 * 로그인 API
 *
 * @route POST /auth/login
 * @summary 사용자 로그인
 * @description 사용자가 이메일과 비밀번호로 로그인하는 API입니다.
 * @param {Object} req - 요청 객체
 * @param {Object} req.body - 요청 본문
 * @param {string} req.body.email - 사용자 이메일
 * @param {string} req.body.password - 사용자 비밀번호
 * @param {Object} res - 응답 객체
 * @returns {Object} 로그인 성공 또는 실패 응답
 *
 * @throws {Error} 400 - 필수 필드 누락 또는 인증 실패
 * @throws {Error} 500 - 서버 내부 오류
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return error(res, '이메일과 비밀번호를 입력하세요.', null, 400);
    }

    const hashedPassword = Buffer.from(password).toString('base64');

    try {
        const [rows] = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0 || rows[0].password !== hashedPassword) {
            return error(res, '이메일 또는 비밀번호가 잘못되었습니다.', null, 401);
        }

        const userId = rows[0].user_id;

        const accessToken = jwt.sign({ userId }, SECRET_KEY, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId }, REFRESH_SECRET_KEY, { expiresIn: '7d' });

        // 로그인 이력 저장
        await executeQuery('INSERT INTO login_history (user_id, login_time) VALUES (?, NOW())', [userId]);

        success(res, '로그인 성공', { accessToken, refreshToken });
    } catch (err) {
        error(res, '로그인 실패', err, 500);
    }
});



/**
 * @swagger
 * paths:
 *  /auth/refresh:
 *    post:
 *      summary: "토큰 갱신"
 *      description: "Refresh 토큰을 사용하여 새로운 Access 토큰을 발급합니다."
 *      tags: [Auth]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                refreshToken:
 *                  type: string
 *                  description: "사용자의 Refresh 토큰"
 *                  example: "eyJhbGciOiJIUzI1NiIsInR..."
 *      responses:
 *        200:
 *          description: "토큰 갱신 성공"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "success"
 *                  message:
 *                    type: string
 *                    example: "토큰 갱신 성공"
 *                  accessToken:
 *                    type: string
 *                    description: "새로 발급된 Access 토큰"
 *                    example: "eyJhbGciOiJIUzI1NiIsInR..."
 *        400:
 *          description: "잘못된 요청 또는 유효하지 않은 Refresh 토큰"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "error"
 *                  message:
 *                    type: string
 *                  code:
 *                    type: integer
 *                    example: 400
 *              examples:
 *                missingToken:
 *                  summary: "Refresh 토큰 누락"
 *                  value:
 *                    status: "error"
 *                    message: "Refresh 토큰이 필요합니다."
 *                    code: 400
 *                invalidToken:
 *                  summary: "유효하지 않은 Refresh 토큰"
 *                  value:
 *                    status: "error"
 *                    message: "유효하지 않은 Refresh 토큰입니다."
 *                    code: 400

 */

/**
 * 토큰 갱신 API
 *
 * @route POST /auth/refresh
 * @summary 토큰 갱신
 * @description Refresh 토큰을 사용하여 새로운 Access 토큰을 발급하는 API입니다.
 * @param {Object} req - 요청 객체
 * @param {Object} req.body - 요청 본문
 * @param {string} req.body.refreshToken - 사용자의 Refresh 토큰
 * @param {Object} res - 응답 객체
 * @returns {Object} 새로운 Access 토큰 또는 에러 메시지
 *
 * @throws {Error} 400 - Refresh 토큰 누락 또는 유효하지 않은 토큰
 * @throws {Error} 500 - 서버 내부 오류
 */
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return error(res, 'Refresh 토큰이 필요합니다.', null, 400);
    }

    try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET_KEY);
        const accessToken = jwt.sign({ userId: decoded.userId }, SECRET_KEY, { expiresIn: '1h' });

        success(res, '토큰 갱신 성공', { accessToken });
    } catch (err) {
        error(res, '유효하지 않은 Refresh 토큰입니다.', err, 400);
    }
});


/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * paths:
 *  /auth/modify:
 *    put:
 *      summary: "회원 정보 수정"
 *      description: "회원의 이름, 이메일, 비밀번호를 수정합니다."
 *      tags: [Auth]
 *      security:
 *        - bearerAuth: []  # Bearer 인증을 사용
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *                  description: "새 이메일 (선택 사항)"
 *                  example: "newuser@example.com"
 *                password:
 *                  type: string
 *                  description: "새 비밀번호 (선택 사항)"
 *                  example: "NewPassword123!"
 *                name:
 *                  type: string
 *                  description: "새 이름 (선택 사항)"
 *                  example: "홍길동"
 *      responses:
 *        200:
 *          description: "회원 정보 수정 성공"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "success"
 *                  message:
 *                    type: string
 *                    example: "회원 정보 수정 성공"
 *                  data:
 *                    type: object
 *                    properties:
 *                      email:
 *                        type: string
 *                        example: "changed@example.com"
 *        400:
 *          description: "잘못된 요청 또는 데이터 형식 오류"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "error"
 *                  message:
 *                    type: string
 *                  code:
 *                    type: integer
 *                    example: 400
 *              examples:
 *                invalidEmail:
 *                  summary: "유효하지 않은 이메일 형식"
 *                  value:
 *                    status: "error"
 *                    message: "유효하지 않은 이메일 형식입니다."
 *                    code: 400
 *                invalidName:
 *                  summary: "유효하지 않은 이름 형식"
 *                  value:
 *                    status: "error"
 *                    message: "이름은 한글, 영어, 숫자만 입력 가능합니다."
 *                    code: 400
 *                invalidPassword:
 *                  summary: "유효하지 않은 비밀번호 형식"
 *                  value:
 *                    status: "error"
 *                    message: "비밀번호는 영어, 숫자, !, @만 포함할 수 있습니다."
 *                    code: 400
 *        401:
 *          description: "권한 없음"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "error"
 *                  message:
 *                    type: string
 *                    example: "권한이 없습니다."
 *                  code:
 *                    type: integer
 *                    example: 401
 *        500:
 *          description: "서버 오류"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "error"
 *                  message:
 *                    type: string
 *                    example: "회원 정보 수정 실패"
 *                  code:
 *                    type: integer
 *                    example: 500
 *                  error:
 *                    type: string
 *                    example: "에러 메세지"
 */

/**
 * 회원 정보 수정 API
 *
 * @route PUT /auth/modify
 * @summary 회원 정보 수정
 * @description 사용자가 자신의 회원 정보를 수정할 수 있는 API 입니다. 수정 가능한 필드는 이메일, 이름, 비밀번호입니다.
 * @param {Object} req - 요청 객체
 * @param {string} req.headers.authorization - Bearer 토큰 (필수)
 * @param {Object} req.body - 요청 본문
 * @param {string} [req.body.email] - 변경할 이메일 (선택 사항)
 * @param {string} [req.body.name] - 변경할 이름 (선택 사항)
 * @param {string} [req.body.password] - 변경할 비밀번호 (선택 사항)
 * @param {Object} res - 응답 객체
 * @returns {Object} 변경된 데이터 또는 에러 메시지를 반환
 *
 * @throws {Error} 400 - 잘못된 요청 또는 데이터 형식 오류
 * @throws {Error} 403 - 권한 없음
 * @throws {Error} 409 - 이미 사용 중인 이메일
 * @throws {Error} 500 - 서버 내부 오류
 */
router.put('/modify', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const { password, name, email } = req.body;

    if (!token) {
        return error(res, '권한이 없습니다.', null, 403);
    }

    const changed = {}; // 변경된 데이터를 추적

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        // 이메일 중복 검사
        if (email) {
            const existingEmail = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);
            if (existingEmail?.[0]?.length > 0) {
                return error(res, '이미 사용 중인 이메일입니다.', null, 409);
            }
        }

        // 데이터 검증 및 변경 추적
        // 이메일 형식 검증
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return error(res, '유효하지 않은 이메일 형식입니다.', null, 400);
            }
            changed.email = email;
        }

        // 이름 형식 검증
        if (name) {
            const nameRegex = /^[a-zA-Z가-힣0-9]+$/;
            if (!nameRegex.test(name)) {
                return error(res, '이름은 한글, 영어, 숫자만 입력 가능합니다.', null, 400);
            }
            changed.name = name;
        }

        // 비밀번호 형식 검증
        if (password) {
            const passwordRegex = /^[a-zA-Z0-9!@]+$/;
            if (!passwordRegex.test(password)) {
                return error(res, '비밀번호는 영어, 숫자, !, @만 포함할 수 있습니다.', null, 400);
            }
            changed.password = Buffer.from(password).toString('base64');
        }

        // 회원 정보 업데이트
        await executeQuery(
            `UPDATE users SET 
                password = COALESCE(?, password), 
                name = COALESCE(?, name), 
                email = COALESCE(?, email)
             WHERE user_id = ?`,
            [changed.password || null, changed.name || null, changed.email || null, decoded.userId]
        );

        // 비밀번호 보안
        if(password) {
            changed.password = '*'.repeat(password.length); // 비밀번호 길이만큼 '*' 대체
        }

        success(res, '회원 정보 수정 성공', changed);
    } catch (err) {
        error(res, '회원 정보 수정 실패', err, 500);
    }
});


/**
 * @swagger
 * paths:
 *  /auth/profile:
 *    get:
 *      summary: "회원 정보 조회"
 *      description: "JWT 토큰을 사용하여 로그인된 사용자의 정보를 조회합니다."
 *      tags: [Auth]
 *      security:
 *        - bearerAuth: []
 *      responses:
 *        200:
 *          description: "회원 정보 조회 성공"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "success"
 *                  message:
 *                    type: string
 *                    example: "회원 정보 조회 성공"
 *                  data:
 *                    type: object
 *                    properties:
 *                      user_id:
 *                        type: integer
 *                        example: 1
 *                      email:
 *                        type: string
 *                        example: "user@example.com"
 *                      name:
 *                        type: string
 *                        example: "홍길동"
 *        403:
 *          description: "권한이 없습니다."
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "error"
 *                  message:
 *                    type: string
 *                    example: "권한이 없습니다."
 *                  code:
 *                    type: integer
 *                    example: 403
 *        404:
 *          description: "사용자를 찾을 수 없습니다."
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "error"
 *                  message:
 *                    type: string
 *                    example: "사용자를 찾을 수 없습니다."
 *                  code:
 *                    type: integer
 *                    example: 404
 *        500:
 *          description: "회원 정보 조회 실패"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "error"
 *                  message:
 *                    type: string
 *                    example: "회원 정보 조회 실패"
 *                  code:
 *                    type: integer
 *                    example: 500
 *                  error:
 *                    type: string
 *                    example: "에러 메세지"
 */

/**
 * 회원 정보 조회 API
 *
 * @route GET /profile
 * @summary 회원 정보 조회
 * @description JWT 토큰을 사용하여 로그인된 사용자의 정보를 조회합니다.
 * @param {Object} req - 요청 객체
 * @param {string} req.headers.authorization - Bearer 토큰 (필수)
 * @param {Object} res - 응답 객체
 * @returns {Object} 사용자의 정보 또는 에러 메시지를 반환
 *
 * @throws {Error} 403 - 권한이 없는 경우
 * 반환 형식:
 * {
 *   "status": "error",
 *   "message": "권한이 없습니다.",
 *   "code": 403
 * }
 * @throws {Error} 404 - 사용자를 찾을 수 없는 경우
 * 반환 형식:
 * {
 *   "status": "error",
 *   "message": "사용자를 찾을 수 없습니다.",
 *   "code": 404
 * }
 * @throws {Error} 500 - 서버 내부 오류
 * 반환 형식:
 * {
 *   "status": "error",
 *   "message": "회원 정보 조회 실패",
 *   "error": "에러 메시지"
 * }
 */
router.get('/profile', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return error(res, "권한이 없습니다.", null, 403);
    }

    try {
        // 토큰 검증
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.userId;

        // 회원 정보 조회
        const [rows] = await executeQuery('SELECT user_id, email, name FROM users WHERE user_id = ?', [userId]);

        if (rows.length === 0) {
            return error(res, "사용자를 찾을 수 없습니다.", null, 404);
        }

        const user = rows[0];

        success(res, "회원 정보 조회 성공", user,);
    } catch (err) {
        error(res, "회원 정보 조회 실패", err, 500);
    }
});


/**
 * @swagger
 * paths:
 *  /auth/delete:
 *    delete:
 *      summary: "회원 탈퇴"
 *      description: "JWT 토큰을 사용하여 로그인된 사용자를 삭제합니다."
 *      tags: [Auth]
 *      security:
 *        - bearerAuth: []  # Bearer 인증 사용
 *      responses:
 *        200:
 *          description: "회원 탈퇴 성공"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "success"
 *                  message:
 *                    type: string
 *                    example: "회원 탈퇴가 완료되었습니다."
 *        403:
 *          description: "권한이 없습니다."
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "error"
 *                  message:
 *                    type: string
 *                    example: "권한이 없습니다."
 *                  code:
 *                    type: integer
 *                    example: 403
 *        404:
 *          description: "해당 사용자를 찾을 수 없습니다."
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "error"
 *                  message:
 *                    type: string
 *                    example: "해당 사용자를 찾을 수 없습니다."
 *                  code:
 *                    type: integer
 *                    example: 404
 *        500:
 *          description: "회원 탈퇴 실패"
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  status:
 *                    type: string
 *                    example: "error"
 *                  message:
 *                    type: string
 *                    example: "회원 탈퇴 실패"
 *                  code:
 *                    type: integer
 *                    example: 500
 *                  error:
 *                    type: string
 *                    example: "에러 메세지"
 */

/**
 * 회원 탈퇴 API
 *
 * @route DELETE /auth/delete
 * @summary 회원 탈퇴
 * @description JWT 토큰을 사용하여 회원 정보를 삭제합니다.
 * @param {Object} req - 요청 객체
 * @param {string} req.headers.authorization - Bearer 토큰 (필수)
 * @param {Object} res - 응답 객체
 * @returns {Object} 성공 또는 에러 메시지를 반환
 *
 * @throws {Error} 403 - 권한이 없는 경우
 * @throws {Error} 404 - 사용자를 찾을 수 없는 경우
 * @throws {Error} 500 - 서버 내부 오류
 */
router.delete('/delete', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return error(res, "권한이 없습니다.", null, 403);
    }

    try {
        // 토큰 검증
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.userId;

        // 회원 삭제 쿼리 실행
        const [result] = await executeQuery('DELETE FROM users WHERE user_id = ?', [userId]);

        // 삭제된 행이 없는 경우
        if (result.affectedRows === 0) {
            return error(res, "해당 사용자를 찾을 수 없습니다.", null, 404);
        }

        success(res, "회원 탈퇴가 완료되었습니다.");
    } catch (err) {
        error(res, "회원 탈퇴 실패", err, 500);
    }
});

module.exports = router;
