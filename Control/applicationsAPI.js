const express = require('express');
const {success, error} = require('../View/response');
const {executeQuery} = require("../Model/executeDB");
const router = express.Router();

/**
 * @swagger
 * paths:
 *  /applications:
 *    post:
 *      summary: "공고 지원"
 *      description: "사용자가 특정 공고에 지원합니다. 취소된 상태('취소됨')의 지원은 다시 활성화할 수 있습니다."
 *      tags: [Applications]
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
 *                  description: "지원할 공고의 ID"
 *                  example: 123
 *      responses:
 *        200:
 *          description: "취소된 지원을 다시 활성화한 경우"
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
 *                    example: "취소된 지원이 다시 활성화되었습니다."
 *                  data:
 *                    type: object
 *                    properties:
 *                      applicationId:
 *                        type: integer
 *                        example: 1
 *                      jobPostingId:
 *                        type: integer
 *                        example: 123
 *                      status:
 *                        type: string
 *                        example: "지원 중"
 *        201:
 *          description: "새로운 지원이 성공적으로 등록된 경우"
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
 *                    example: "지원이 완료되었습니다."
 *                  data:
 *                    type: object
 *                    properties:
 *                      applicationId:
 *                        type: integer
 *                        example: 2
 *                      jobPostingId:
 *                        type: integer
 *                        example: 123
 *                      status:
 *                        type: string
 *                        example: "지원 중"
 *        400:
 *          description: "중복 지원 또는 잘못된 요청"
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
 *                    example: "이미 지원한 공고입니다."
 *                  code:
 *                    type: integer
 *                    example: "400"
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
 *                    example: "지원에 실패했습니다."
 *                  code:
 *                    type: integer
 *                    example: "500"
 *                  error:
 *                    type: string
 *                    example: "Error message"
 */

/**
 * @route POST /applications
 * @summary 지원하기 API
 * @description 사용자가 특정 공고에 지원합니다. 이미 지원한 경우 상태에 따라 업데이트하거나 오류를 반환합니다.
 * @access Private
 * @param {object} req - Express 요청 객체
 * @param {object} res - Express 응답 객체
 * @param {object} req.body - 요청 본문 데이터
 * @param {number} req.body.jobPostingId - 지원할 공고의 ID
 * @param {object} req.user - 인증된 사용자 정보 (JWT를 통해 제공됨)
 * @param {number} req.user.userId - 사용자 ID
 * @returns {object} 성공 또는 실패 응답
 *
 * @throws {400} "공고 ID를 입력하세요." - 공고 ID가 제공되지 않은 경우
 * @throws {400} "이미 지원한 공고입니다." - 사용자가 이미 해당 공고에 지원한 경우
 * @throws {200} "취소된 지원이 다시 활성화되었습니다." - 상태가 '취소됨'인 지원이 활성화된 경우
 * @throws {201} "지원이 완료되었습니다." - 새로운 지원이 성공적으로 추가된 경우
 * @throws {500} "지원에 실패했습니다." - 서버 오류 발생 시
 */
router.post('/', async (req, res) => {
    const { jobPostingId } = req.body;
    const userId = req.user.userId;

    if (!jobPostingId) {
        return error(res, '공고 ID를 입력하세요.', null, 400);
    }

    try {
        // 중복 지원 체크
        const [existing] = await executeQuery(
            `SELECT * 
             FROM applications 
             WHERE user_id = ? 
               AND job_posting_id = ?`,
            [userId, jobPostingId]
        );

        if (existing.length > 0) {
            const existingApplication = existing[0];

            // 상태가 '취소 됨'인 경우 상태를 업데이트
            if (existingApplication.status === '취소됨') {
                await executeQuery(
                    `UPDATE applications 
                     SET status = '지원 중', updated_at = NOW() 
                     WHERE application_id = ?`,
                    [existingApplication.application_id]
                );

                return success(res, '취소된 지원이 다시 활성화되었습니다.', {
                    applicationId: existingApplication.application_id,
                    jobPostingId,
                    status: '지원 중',
                });
            }

            // 다른 상태일 경우 중복 지원 제한
            return error(res, '이미 지원한 공고입니다.', null, 400);
        }

        // 새로운 지원 정보 저장
        const [result] = await executeQuery(
            `INSERT INTO applications (user_id, job_posting_id, status, created_at) 
             VALUES (?, ?, '지원 중', NOW())`,
            [userId, jobPostingId]
        );

        success(res, '지원이 완료되었습니다.', {
            applicationId: result.insertId,
            jobPostingId,
            status: '지원 중',
        }, null, true);
    } catch (err) {
        error(res, '지원에 실패했습니다.', err, 500);
    }
});


/**
 * @swagger
 * /applications/{id}:
 *   delete:
 *     summary: "지원 취소"
 *     description: "사용자가 특정 지원 내역을 취소합니다. 지원 상태가 '지원 중'인 경우에만 취소 가능합니다."
 *     tags:
 *       - Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "취소할 지원 ID"
 *         example: 1
 *     responses:
 *       200:
 *         description: "지원 취소 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "지원이 취소되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: string
 *                       example: "1"
 *       404:
 *         description: "지원 내역이 존재하지 않음"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "해당 지원 내역을 찾을 수 없습니다."
 *                 code:
 *                   type: integer
 *                   example: 404
 *       400:
 *         description: "이미 처리된 지원"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "지원 중 상태가 아닙니다."
 *                 code:
 *                   type: integer
 *                   example: 400
 *       500:
 *         description: "서버 오류"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "지원 취소에 실패했습니다."
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */

/**
 * @function
 * @name deleteApplication
 * @description 사용자가 특정 지원 내역을 취소합니다. 지원 상태가 '지원 중'인 경우에만 취소 가능합니다.
 * @route DELETE /applications/:id
 * @access Private
 * @param {object} req - Express 요청 객체
 * @param {object} res - Express 응답 객체
 * @returns {void}
 *
 * @example
 * // 성공 시 응답
 * res.status(200).send({
 *   status: "success",
 *   message: "지원이 취소되었습니다.",
 *   data: {
 *      value: "2"
 *   }
 * });
 *
 * @example
 * // 지원 내역이 없는 경우
 * res.status(404).send({
 *   status: "error",
 *   message: "해당 지원 내역을 찾을 수 없습니다.",
 *   code: 404
 * });
 *
 * @example
 * // 이미 처리된 지원인 경우
 * res.status(400).send({
 *   status: "error",
 *   message: "이미 처리된 지원은 취소할 수 없습니다.",
 *   code: 400
 * });
 *
 * @example
 * // 서버 오류
 * res.status(500).send({
 *   status: "error",
 *   message: "지원 취소에 실패했습니다.",
 *   code: 500,
 *   error: "Error message"
 * });
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        // 지원 내역 확인
        const [application] = await executeQuery(
            'SELECT * FROM applications WHERE application_id = ? AND user_id = ?',
            [id, userId]
        );

        if (application.length === 0) {
            return error(res, '해당 지원 내역을 찾을 수 없습니다.', null, 404);
        }

        if (application[0].status !== '지원 중') {
            return error(res, '지원 중 상태가 아닙니다.', null, 400);
        }

        // 지원 상태 업데이트
        await executeQuery(
            'UPDATE applications SET status = ? WHERE application_id = ?',
            ['취소됨', id]
        );

        success(res, '지원이 취소되었습니다.', id);
    } catch (err) {
        error(res, '지원 취소에 실패했습니다.', err, 500);
    }
});


/**
 * @swagger
 * paths:
 *  /applications:
 *    get:
 *      summary: "지원 내역 조회"
 *      description: "사용자가 지원한 공고 내역을 조회합니다. 상태별 필터링 및 날짜 정렬 옵션을 제공합니다."
 *      tags: [Applications]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: query
 *          name: status
 *          schema:
 *            type: string
 *          description: "필터링할 지원 상태 (예: 지원 중, 취소됨, 채용 완료, 탈락)"
 *          example: "지원 중"
 *        - in: query
 *          name: sortByDate
 *          schema:
 *            type: string
 *            enum: [asc, desc]
 *          description: "날짜 정렬 옵션 ('asc' 또는 'desc'). 기본값은 'desc'."
 *          example: "desc"
 *      responses:
 *        200:
 *          description: "지원 내역 조회 성공"
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
 *                    example: "지원 내역을 반환합니다."
 *                  data:
 *                    type: object
 *                    properties:
 *                      totalCount:
 *                        type: integer
 *                        example: 1
 *                      applications:
 *                        type: array
 *                        items:
 *                          type: object
 *                          properties:
 *                            status:
 *                              type: string
 *                              example: "지원 중"
 *                            created_at:
 *                              type: string
 *                              format: date-time
 *                              example: "2023-12-01T12:00:00.000Z"
 *                            user_name:
 *                              type: string
 *                              example: "홍길동"
 *                            company_name:
 *                              type: string
 *                              example: "OpenAI"
 *                            sectors:
 *                              type: string
 *                              example: "IT, 소프트웨어"
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
 *                    example: "유효하지 않은 지원 상태입니다."
 *                  code:
 *                    type: integer
 *                    example: 400
 *        404:
 *          description: "내역 없음"
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
 *                    example: "부합한 지원 내역이 없습니다."
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
 *                    example: "지원 내역 조회에 실패했습니다."
 *                  code:
 *                    type: integer
 *                    example: 404
 *                  error:
 *                    type: string
 *                    example: "Error message"
 */

/**
 * 사용자의 지원 내역을 조회합니다.
 *
 * @route GET /applications
 * @access Private
 * @query {string} [status] - 지원 상태 필터 (예: '지원 중', '취소됨', '채용 완료', '탈락').
 * @query {string} [sortByDate] - 날짜별 정렬 순서 ('asc' 또는 'desc'). 기본값은 'desc'.
 * @returns {Object} 200 - 지원 내역 조회 성공 시 반환되는 객체
 * @returns {Object} 404 - 부합하는 지원 내역이 없을 경우
 * @returns {Object} 500 - 서버 오류 발생 시
 *
 * @example
 * 성공 응답:
 * {
 *   "status": "success",
 *   "message": "지원 내역을 반환합니다.",
 *   "data": {
 *     "totalCount": 3,
 *     "applications": [
 *       {
 *         "application_id": 1,
 *         "status": "지원 중",
 *         "created_at": "2024-12-10T12:00:00.000Z",
 *         "user_name": "홍길동",
 *         "title": "백엔드 개발자 채용",
 *         "company_name": "OpenAI",
 *         "sectors": ["IT", "소프트웨어"]
 *       },
 *       ...
 *     ]
 *   }
 * }
 *
 * @example
 * 오류 응답:
 * {
 *   "status": "error",
 *   "message": "부합하는 지원 내역이 없습니다.",
 *   "code": 404
 * }
 */
router.get('/', async (req, res) => {
    const { status, sortByDate } = req.query;
    const userId = req.user.userId;

    if (status && !['지원 중', '취소됨', '채용 완료', '탈락'].includes(status)) {
        return error(res, '유효하지 않은 지원 상태입니다.', null, 400);
    }

    try {

        // 사용자의 지원 내역, 회사 정보, 직무 분야 등을 조인하여 조회
        let query = `
            SELECT 
                a.application_id,
                a.status, 
                a.created_at, 
                u.name AS user_name,
                j.title, 
                c.company_name, 
                GROUP_CONCAT(DISTINCT s.sector_name) AS sectors
            FROM applications a
            JOIN users u ON a.user_id = u.user_id
            JOIN job_postings j ON a.job_posting_id = j.job_posting_id
            JOIN companies c ON j.company_id = c.company_id
            LEFT JOIN job_posting_sectors js ON j.job_posting_id = js.job_posting_id
            LEFT JOIN sectors s ON js.sector_id = s.sector_id
            WHERE a.user_id = ?
        `;
        const params = [userId];

        // 상태별 필터링
        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }

        // 날짜 별 정렬 기본값 desc
        const orderBy = (!sortByDate || sortByDate.toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        query += `
            GROUP BY a.application_id, a.job_posting_id, a.status, a.created_at, u.name, c.company_name
            ORDER BY a.created_at ${orderBy}
        `;

        //데이터 조회
        const [applications] = await executeQuery(query, params);

        // 총 건수 계산
        const totalCount = applications.length;

        // 건수가 없으면 지원 내역이 없음 반환
        if (totalCount === 0) {
            return error(res, "부합하는 지원 내역이 없습니다.", null, 404);
        }

        success(res, "지원 내역을 반환합니다.", {
            totalCount,
            applications,
        });
    } catch (err) {
        error(res, '지원 내역 조회에 실패했습니다.', err, 500);
    }
});


module.exports = router;
