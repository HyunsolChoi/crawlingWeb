const express = require('express');
const {success, error} = require('../View/response');
const {executeQuery} = require("../Model/executeDB");
const router = express.Router();

/**
 * @swagger
 * paths:
 *  /bookmarks:
 *    post:
 *      summary: "북마크 추가/제거"
 *      description: "사용자가 특정 공고를 북마크하거나 기존 북마크를 제거합니다. 북마크가 이미 존재하면 제거하고, 없으면 새로 추가합니다."
 *      tags: [Bookmarks]
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                jobPostingId:
 *                  type: integer
 *                  description: "북마크를 추가하거나 제거할 공고의 ID"
 *                  example: 123
 *      responses:
 *        200:
 *          description: "북마크 제거 성공"
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
 *                    example: "북마크가 제거되었습니다."
 *                  data:
 *                    type: object
 *                    properties:
 *                      value:
 *                        type: integer
 *                        example: 123
 *        201:
 *          description: "북마크 추가 성공"
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
 *                    example: "북마크가 추가되었습니다."
 *                  data:
 *                    type: object
 *                    properties:
 *                      value:
 *                        type: integer
 *                        example: 123
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
 *                    example: "공고 ID를 제공해야 합니다."
 *                  code:
 *                    type: integer
 *                    example: 400
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
 *                    example: "북마크 처리 중 오류가 발생했습니다."
 *                  code:
 *                    type: integer
 *                    example: 500
 *                  error:
 *                    type: string
 *                    example: "Error message"
 */

/**
 * 북마크 추가 또는 제거
 * 사용자가 특정 공고를 북마크하거나 기존 북마크를 제거합니다. 이미 북마크가 존재하면 제거, 없으면 새로 추가됩니다.
 * @route POST /bookmarks
 * @async
 * @function
 * @param {object} req - Express 요청 객체
 * @param {object} req.body - 요청 본문
 * @param {number} req.body.jobPostingId - 북마크를 추가하거나 제거할 공고 ID
 * @param {object} res - Express 응답 객체
 * @returns {void}
 */
router.post('/', async (req, res) => {
    const { jobPostingId } = req.body;
    const userId = req.user.userId;

    if (!jobPostingId) {
        return error(res, '공고 ID를 제공해야 합니다.', null, 400);
    }

    try {
        // 북마크 여부 확인
        const [existingBookmark] = await executeQuery(
            'SELECT * FROM bookmarks WHERE user_id = ? AND job_posting_id = ?',
            [userId, jobPostingId]
        );

        if (existingBookmark.length > 0) {
            // 북마크 제거
            await executeQuery(
                'DELETE FROM bookmarks WHERE user_id = ? AND job_posting_id = ?',
                [userId, jobPostingId]
            );
            return success(res, '북마크가 제거되었습니다.', jobPostingId);
        } else {
            // 북마크 추가
            await executeQuery(
                'INSERT INTO bookmarks (user_id, job_posting_id, created_at) VALUES (?, ?, NOW())',
                [userId, jobPostingId]
            );
            return success(res, '북마크가 추가되었습니다.', jobPostingId, null, true);
        }
    } catch (err) {
        error(res, '북마크 처리 중 오류가 발생했습니다.', err, 500);
    }
});


/**
 * @swagger
 * paths:
 *  /bookmarks:
 *    get:
 *      summary: "북마크 목록 조회"
 *      description: "사용자의 북마크 목록을 조회합니다. 목록에는 북마크 생성 날짜, 공고 제목, 회사 이름, 직무 분야 정보 등이 포함됩니다."
 *      tags: [Bookmarks]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: query
 *          name: page
 *          schema:
 *            type: integer
 *          description: "조회할 페이지 번호 (기본값: 1)"
 *          example: 1
 *      responses:
 *        200:
 *          description: "북마크 목록 조회 성공"
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
 *                    example: "북마크 목록 반환"
 *                  data:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        job_posting_id:
 *                          type: integer
 *                          example: 1
 *                          description: "공고 ID"
 *                        created_at:
 *                          type: string
 *                          format: date-time
 *                          description: "북마크 생성 날짜"
 *                          example: "2023-12-01T12:00:00.000Z"
 *                        title:
 *                          type: string
 *                          description: "북마크된 공고 제목"
 *                          example: "백엔드 개발자 채용"
 *                        company_name:
 *                          type: string
 *                          description: "공고의 회사 이름"
 *                          example: "OpenAI"
 *                        sectors:
 *                          type: string
 *                          description: "북마크된 공고의 직무 분야"
 *                          example: "IT, 소프트웨어"
 *                  pagination:
 *                    type: object
 *                    properties:
 *                      currentPage:
 *                        type: integer
 *                        example: 1
 *                      totalPages:
 *                        type: integer
 *                        example: 1
 *                      pageSize:
 *                        type: integer
 *                        example: 20
 *                      totalItems:
 *                        type: integer
 *                        example: 1
 *        400:
 *          description: "잘못된 페이지 요청"
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
 *                    example: "부적절한 페이지 값"
 *                  code:
 *                    type: integer
 *                    example: 400
 *        404:
 *          description: "조회된 북마크 없음"
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
 *                    example: "북마크 된 공고가 없습니다."
 *                  code:
 *                    type: integer
 *                    example: 404
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
 *                    example: "북마크 목록 조회 실패"
 *                  code:
 *                    type: integer
 *                    example: 500
 *                  error:
 *                    type: string
 *                    example: "Error message"
 */

/**
 * @route GET /bookmarks
 * @group Bookmarks - 북마크 관리
 * @summary 북마크 목록 조회
 * @description 사용자의 북마크 목록을 조회합니다. 목록은 페이징 처리가 되며, 각 북마크에는 공고와 관련된 기본 정보와 분야 정보가 포함됩니다.
 * @security bearerAuth
 * @param {number} page.query - 현재 페이지 번호 (기본값: 1)
 * @returns {object} 200 - 북마크 목록 반환 성공
 * @returns {object} 404 - 북마크 된 공고가 없음
 * @returns {object} 500 - 북마크 목록 조회 실패
 *
 * @example success-response (200)
 * {
 *   "status": "success",
 *   "message": "북마크 목록 반환",
 *   "data": [
 *     {
 *       "job_posting_id": 123,
 *       "created_at": "2024-12-13T12:34:56.000Z",
 *       "title": "백엔드 개발자 채용",
 *       "company_name": "OpenAI",
 *       "sectors": ["IT", "소프트웨어"]
 *     },
 *     {
 *       "job_posting_id": 124,
 *       "created_at": "2024-12-12T11:22:33.000Z",
 *       "title": "프론트엔드 개발자 채용",
 *       "company_name": "OpenAI",
 *       "sectors": ["IT", "디자인"]
 *     }
 *   ],
 *   "pagination": {
 *     "currentPage": 1,
 *     "totalPages": 1,
 *     "pageSize": 20,
 *     "totalItems": 1
 *   }
 * }
 *
 * @example error-response (404)
 * {
 *   "status": "error",
 *   "message": "북마크 된 공고가 없습니다.",
 *   "code": 404
 * }
 *
 * @example error-response (500)
 * {
 *   "status": "error",
 *   "message": "북마크 목록 조회 실패",
 *   "code": 500
 *   "error": "데이터베이스 연결 오류"
 * }
 */
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1; // 0도 1로 받아와서 0은 문제없이 수행 가능
    const PAGE_SIZE = 20; // 페이지당 항목 수
    const offset = (page - 1) * PAGE_SIZE;
    const userId = req.user.userId;

    // 부적절한 페이지 값 입력, 최대 한도는 DB 조회 후 알 수 있으므로 코드 끝단에서 실행
    if(page < 1){
        return error(res, "부적절한 페이지 값", null, 400);
    }

    try {
        // 북마크 목록 조회 (분야 정보 포함)
        const [bookmarks] = await executeQuery(
            `
            SELECT 
                j.job_posting_id,
                b.created_at, 
                j.title, 
                c.company_name, 
                GROUP_CONCAT(s.sector_name) AS sectors
            FROM bookmarks b
            JOIN job_postings j ON b.job_posting_id = j.job_posting_id
            JOIN companies c ON j.company_id = c.company_id
            LEFT JOIN job_posting_sectors js ON j.job_posting_id = js.job_posting_id
            LEFT JOIN sectors s ON js.sector_id = s.sector_id
            WHERE b.user_id = ?
            GROUP BY j.job_posting_id, b.created_at, j.title, c.company_name
            ORDER BY b.created_at DESC
            LIMIT ? OFFSET ?
            `,
            [userId, PAGE_SIZE, offset]
        );

        // 총 북마크 수 조회
        const [totalCountResult] = await executeQuery(
            'SELECT COUNT(*) AS totalCount FROM bookmarks WHERE user_id = ?',
            [userId]
        );
        const totalCount = totalCountResult[0].totalCount;

        if(totalCount === 0) {
            return error(res, '북마크 된 공고가 없습니다.', null, 404);
        }

        const pagination = {
            currentPage: page,
            totalPages: Math.ceil(totalCount / PAGE_SIZE),
            pageSize: PAGE_SIZE,
            totalItems: totalCount,
        };

        // 요청 페이지가 유효 범위 벗어나는 경우
        if(page > pagination.totalPages || page < 1){
            return error(res, "부적절한 페이지 값", null, 400);
        }

        success(res, '북마크 목록 반환', bookmarks, pagination);

    } catch (err) {
        error(res, '북마크 목록 조회 실패', err, 500);
    }
});

module.exports = router;
