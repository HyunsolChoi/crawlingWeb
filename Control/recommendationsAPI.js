const express = require('express');
const {success, error} = require('../View/response');
const {executeQuery} = require("../Model/executeDB");

const router = express.Router();



/**
 * @swagger
 * paths:
 *  /recommendations:
 *    get:
 *      summary: "추천 공고 조회"
 *      description: "사용자의 북마크 및 지원 공고 데이터를 기반으로 추천 공고를 조회합니다."
 *      tags: [Recommendations]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: query
 *          name: page
 *          schema:
 *            type: integer
 *          description: "페이지 번호 (기본값: 1)"
 *          example: 1
 *      responses:
 *        200:
 *          description: "추천 공고 조회 성공"
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
 *                    example: "추천 공고 조회 성공"
 *                  data:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        job_posting_id:
 *                          type: integer
 *                          example: 1
 *                        title:
 *                          type: string
 *                          example: "백엔드 개발자 모집"
 *                        company_name:
 *                          type: string
 *                          example: "OpenAI"
 *                        salary:
 *                          type: string
 *                          example: "5,000 만원"
 *                        link:
 *                          type: string
 *                          example: "https://example.com/job1"
 *                        deadline:
 *                          type: string
 *                          format: date
 *                          example: "~12/31(화)"
 *                        locations:
 *                          type: array
 *                          description: "지역 정보"
 *                          items:
 *                            type: string
 *                          example: ["서울", "경기"]
 *                        sectors:
 *                          type: array
 *                          description: "직무 분야"
 *                          items:
 *                            type: string
 *                          example: ["개발자", "백엔드"]
 *                        employment_types:
 *                          type: array
 *                          description: "고용 형태"
 *                          items:
 *                            type: string
 *                          example: ["정규직"]
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
 *          description: "추천할 공고가 없음"
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
 *                    example: "추천할 공고가 없습니다."
 *                  code:
 *                    type: integer
 *                    example: 404
 *        422:
 *          description: "북마크 및 지원란이 비어있음"
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
 *                    example: "북마크 및 지원란이 비어있습니다."
 *                  code:
 *                    type: integer
 *                    example: 422
 *        500:
 *          description: "추천 공고 조회 실패"
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
 *                    example: "추천 공고 조회 실패"
 *                  code:
 *                    type: integer
 *                    example: 500
 *                  error:
 *                    type: string
 *                    example: "Error message"
 */

/**
 * @route GET /recommendations/
 * @summary 사용자 선호 직무 분야 기반 추천 공고 조회
 * @description 사용자의 북마크 또는 지원 공고를 기반으로 선호 직무 분야를 추출하여 추천 공고를 반환합니다.
 * 페이지네이션이 적용되며, 잘못된 페이지 값 또는 데이터가 없는 경우 적절한 에러를 반환합니다.
 * @access Private
 * @param {number} req.query.page - 페이지 번호 (기본값: 1)
 * @returns {object} 성공 시 추천 공고 데이터와 페이지네이션 정보 반환
 * @throws {Error} 400 - 부적절한 페이지 값
 * @throws {Error} 422 - 북마크 및 지원란이 비어 있음
 * @throws {Error} 404 - 추천할 공고가 없음
 * @throws {Error} 500 - 서버 내부 오류
 */
router.get('/', async (req, res) => {
    const userId = req.user.userId; // JWT 토큰에서 추출된 사용자 ID
    const page = parseInt(req.query.page) || 1; // 0도 1로 받아와서 0은 문제없이 수행 가능
    const PAGE_SIZE = 20; // 페이지 크기 고정
    const offset = (page - 1) * PAGE_SIZE;

    // 부적절한 페이지 값 입력, 최대 한도는 DB 조회 후 알 수 있으므로 코드 끝단에서 실행
    if(page < 1){
        return error(res, "부적절한 페이지 값", null, 400);
    }

    try {
        // 사용자의 북마크 및 지원 공고에서 선호 직무 분야 추출
        const [userSectors] = await executeQuery(
            `SELECT DISTINCT js.sector_id
             FROM job_postings jp
             JOIN job_posting_sectors js ON jp.job_posting_id = js.job_posting_id
             WHERE jp.job_posting_id IN (
                 SELECT job_posting_id FROM bookmarks WHERE user_id = ?
                 UNION
                 SELECT job_posting_id FROM applications WHERE user_id = ?
             )`,
            [userId, userId]
        );

        if (userSectors.length === 0) {
            return error(res, "북마크 및 지원란이 비어있습니다.", null, 422);
        }

        // 추천 공고 총 개수 조회
        const sectorIds = userSectors.map(s => s.sector_id);
        const [totalCountResult] = await executeQuery(
            `SELECT COUNT(DISTINCT jp.job_posting_id) AS totalCount
             FROM job_postings jp
             JOIN job_posting_sectors js ON jp.job_posting_id = js.job_posting_id
             WHERE js.sector_id IN (?)
             AND jp.job_posting_id NOT IN (
                 SELECT job_posting_id FROM applications WHERE user_id = ?
             )`,
            [sectorIds, userId]
        );
        const totalItems = totalCountResult[0].totalCount;

        if (totalItems === 0) {
            return error(res, "추천할 공고가 없습니다.", null, 404);
        }

        // 추천 공고 데이터 조회
        const [recommendedJobs] = await executeQuery(
            `SELECT DISTINCT
                jp.job_posting_id,
                jp.title,
                c.company_name,
                jp.salary,
                jp.link,
                jp.deadline,
                GROUP_CONCAT(DISTINCT s.sector_name SEPARATOR ', ') AS sectors,
                GROUP_CONCAT(DISTINCT l.location_name SEPARATOR ', ') AS locations,
                GROUP_CONCAT(DISTINCT et.employment_type_name SEPARATOR ', ') AS employment_types
             FROM job_postings jp
             JOIN companies c ON jp.company_id = c.company_id
             JOIN job_posting_sectors js ON jp.job_posting_id = js.job_posting_id
             JOIN sectors s ON js.sector_id = s.sector_id
             LEFT JOIN job_posting_locations jl ON jp.job_posting_id = jl.job_posting_id
             LEFT JOIN locations l ON jl.location_id = l.location_id
             LEFT JOIN job_posting_employment_types je ON jp.job_posting_id = je.job_posting_id
             LEFT JOIN employment_types et ON je.employment_type_id = et.employment_type_id
             WHERE js.sector_id IN (?)
             AND jp.job_posting_id NOT IN (
                 SELECT job_posting_id FROM applications WHERE user_id = ?
             )
             GROUP BY jp.job_posting_id
             LIMIT ? OFFSET ?`,
            [sectorIds, userId, PAGE_SIZE, offset]
        );

        // 반환을 위한 데이터 여과
        const formattedRows = recommendedJobs.map(row => ({
            job_posting_id: row.job_posting_id,
            title: row.title,
            company_name: row.company_name,
            salary: row.salary,
            link: row.link,
            deadline: row.deadline,
            views: row.views,
            locations: row.locations ? row.locations.split(', ') : [],
            sectors: row.sectors ? row.sectors.split(', ') : [],
            employment_types: row.employment_types ? row.employment_types.split(', ') : []
        }));

        // 페이지네이션 데이터 생성
        const pagination = {
            currentPage: page,
            totalPages: Math.ceil(totalItems / PAGE_SIZE),
            pageSize: PAGE_SIZE,
            totalItems: totalItems,
        };

        // 요청 페이지가 유효 범위 벗어나는 경우
        if(page > pagination.totalPages || page < 1){
            return error(res, "부적절한 페이지 값", null, 400);
        }

        // 데이터 반환
        success(res, "추천 공고 조회 성공", formattedRows, pagination);
    } catch (err) {
        error(res, "추천 공고 조회 실패", err, 500);
    }
});


/**
 * @swagger
 * paths:
 *  /recommendations/popular:
 *    get:
 *      summary: "인기 공고 조회"
 *      description: "상위 100개의 조회수가 높은 공고를 가져오되, 동일 조회수일 경우 랜덤 정렬하며 페이지네이션을 지원합니다."
 *      tags: [Recommendations]
 *      parameters:
 *        - in: query
 *          name: page
 *          schema:
 *            type: integer
 *          description: "페이지 번호 (기본값: 1)"
 *      responses:
 *        200:
 *          description: "인기 공고 조회 성공"
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
 *                    example: "인기 공고 조회 성공"
 *                  data:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        jobPostingId:
 *                          type: integer
 *                          example: 1
 *                        title:
 *                          type: string
 *                          example: "백엔드 개발자 채용"
 *                        companyName:
 *                          type: string
 *                          example: "OpenAI"
 *                        salary:
 *                          type: string
 *                          example: "7,000 만원"
 *                        link:
 *                          type: string
 *                          example: "https://example.com/backend-job"
 *                        deadline:
 *                          type: string
 *                          example: "~ 12/31(화)"
 *                        views:
 *                          type: integer
 *                          example: 500
 *                        locations:
 *                          type: array
 *                          items:
 *                            type: string
 *                          example: ["서울", "경기"]
 *                        sectors:
 *                          type: array
 *                          items:
 *                            type: string
 *                          example: ["IT", "소프트웨어"]
 *                        employment_types:
 *                          type: array
 *                          items:
 *                            type: string
 *                          example: ["정규직"]
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
 *        404:
 *          description: "조회된 공고 없음"
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
 *                    example: "불러온 공고가 없습니다."
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
 *                    example: "인기 공고 조회 실패"
 *                  code:
 *                    type: integer
 *                    example: 500
 *                  error:
 *                    type: string
 *                    example: "Error message"
 */

/**
 * @route GET /recommendations/popular
 * @description 인기 공고 조회
 * @param {number} [req.query.page=1] - 페이지 번호 (기본값: 1)
 * @returns {object} 200 - 성공적으로 인기 공고를 반환합니다.
 * @returns {string} 200.status - 요청 상태 ("success")
 * @returns {string} 200.message - 응답 메시지 ("인기 공고 조회 성공")
 * @returns {array} 200.data - 인기 공고 데이터
 * @returns {object[]} 200.data[] - 인기 공고 객체
 * @returns {number} 200.data[].job_posting_id - 공고 ID
 * @returns {string} 200.data[].title - 공고 제목
 * @returns {string} 200.data[].company_name - 회사 이름
 * @returns {string} 200.data[].salary - 급여 정보
 * @returns {string} 200.data[].link - 공고 링크
 * @returns {string} 200.data[].deadline - 마감일
 * @returns {number} 200.data[].views - 조회수
 * @returns {string[]} 200.data[].locations - 지역 목록
 * @returns {string[]} 200.data[].sectors - 직무 분야 목록
 * @returns {string[]} 200.data[].employment_types - 고용 형태 목록
 * @returns {object} 200.pagination - 페이지네이션 정보
 * @returns {number} 200.pagination.currentPage - 현재 페이지
 * @returns {number} 200.pagination.totalPages - 전체 페이지 수
 * @returns {number} 200.pagination.pageSize - 페이지당 항목 수
 * @returns {number} 200.pagination.totalItems - 전체 항목 수
 * @returns {object} 404 - 불러온 공고가 없는 경우
 * @returns {string} 404.status - 요청 상태 ("error")
 * @returns {string} 404.message - 응답 메시지 ("불러온 공고가 없습니다.")
 * @returns {object} 500 - 서버 에러가 발생한 경우
 * @returns {string} 500.status - 요청 상태 ("error")
 * @returns {string} 500.message - 응답 메시지 ("인기 공고 조회 실패")
 * @returns {string} 500.error - 에러 메시지
 */
router.get('/popular', async (req, res) => {
    const page = parseInt(req.query.page) || 1; // 페이지 번호
    const PAGE_SIZE = 20; // 페이지 크기
    const offset = (page - 1) * PAGE_SIZE;

    if(page < 1){
        return error(res, "부적절한 페이지 값", null, 400);
    }

    try {
        // 상위 100개 인기 공고 조회
        const [topJobs] = await executeQuery(
            `SELECT 
            j.job_posting_id,
            j.title,
            c.company_name,
            j.salary,
            j.link,
            j.deadline,
            j.views,
            GROUP_CONCAT(DISTINCT s.sector_name SEPARATOR ', ') AS sectors,
            GROUP_CONCAT(DISTINCT l.location_name SEPARATOR ', ') AS locations,
            GROUP_CONCAT(DISTINCT et.employment_type_name SEPARATOR ', ') AS employment_types
            FROM job_postings j
            JOIN companies c ON j.company_id = c.company_id
            LEFT JOIN job_posting_sectors js ON j.job_posting_id = js.job_posting_id
            LEFT JOIN sectors s ON js.sector_id = s.sector_id
            LEFT JOIN job_posting_locations jl ON j.job_posting_id = jl.job_posting_id
            LEFT JOIN locations l ON jl.location_id = l.location_id
            LEFT JOIN job_posting_employment_types je ON j.job_posting_id = je.job_posting_id
            LEFT JOIN employment_types et ON je.employment_type_id = et.employment_type_id
            WHERE j.views > 0
            GROUP BY j.job_posting_id
            ORDER BY j.views DESC, RAND()
            LIMIT ? OFFSET ?`, [PAGE_SIZE, offset]
        );

        // 반환을 위한 데이터 여과
        const formattedRows = topJobs.map(row => ({
            job_posting_id: row.job_posting_id,
            title: row.title,
            company_name: row.company_name,
            salary: row.salary,
            link: row.link,
            deadline: row.deadline,
            views: row.views,
            locations: row.locations ? row.locations.split(', ') : [],
            sectors: row.sectors ? row.sectors.split(', ') : [],
            employment_types: row.employment_types ? row.employment_types.split(', ') : []
        }));

        const totalItems = topJobs.length;

        // 읽어온 데이터가 없을 경우
        if (!topJobs || totalItems === 0) {
            return error(res, "불러온 공고가 없습니다.", null, 404);
        }

        // 페이지네이션 데이터 생성
        const pagination = {
            currentPage: page,
            totalPages: Math.ceil(totalItems / PAGE_SIZE),
            pageSize: PAGE_SIZE,
            totalItems: totalItems,
        };

        // 요청 페이지가 유효 범위 벗어나는 경우
        if(page > pagination.totalPages || page < 1){
            return error(res, "부적절한 페이지 값", null, 400);
        }

        // 응답 반환
        success(res, "인기 공고 조회 성공", formattedRows, pagination);
    } catch (err) {
        error(res, "인기 공고 조회 실패", err, 500);
    }
});


/**
 * @swagger
 * /recommendations/pay:
 *   get:
 *     summary: "급여 순 공고 조회"
 *     description: "급여 정보가 '추후 협의'가 아닌 공고 중, 1000만 원 이상인 공고를 내림차순으로 조회합니다. 페이지네이션 기능이 포함되어 있습니다."
 *     tags:
 *       - Recommendations
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         required: false
 *         description: "조회할 페이지 번호 (기본값: 1)"
 *     responses:
 *       200:
 *         description: "급여 순 공고 조회 성공"
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
 *                   example: "급여 순 공고 조회 성공"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       job_posting_id:
 *                         type: integer
 *                         example: 123
 *                       title:
 *                         type: string
 *                         example: "백엔드 개발자 채용"
 *                       company_name:
 *                         type: string
 *                         example: "OpenAI"
 *                       salary:
 *                         type: string
 *                         example: "5,000 만원"
 *                       link:
 *                         type: string
 *                         example: "https://example.com/job/123"
 *                       deadline:
 *                         type: string
 *                         example: "~ 12/31(화)"
 *                       views:
 *                         type: integer
 *                         example: 1500
 *                       locations:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["서울", "경기"]
 *                       sectors:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["IT", "소프트웨어"]
 *                       employment_types:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["정규직"]
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 20
 *                     totalItems:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: "잘못된 페이지 요청"
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
 *                   example: "부적절한 페이지 값"
 *                 code:
 *                   type: integer
 *                   example: 400
 *       500:
 *         description: "급여 순 공고 조회 실패"
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
 *                   example: "급여 순 공고 조회 실패"
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */

/**
 * @function
 * @name getPayJobs
 * @description 연봉 정보가 있는 공고 중 1,000만 원 이상인 공고를 급여 내림차순으로 조회합니다.
 * @route GET /recommendations/pay
 * @param {Object} req - Express 요청 객체
 * @param {Object} req.query - 쿼리 매개변수
 * @param {number} [req.query.page=1] - 조회할 페이지 번호
 * @param {Object} res - Express 응답 객체
 * @returns {void} 반환 데이터는 JSON 형식으로 구성됩니다.
 */
router.get('/pay', async (req, res) => {
    const page = parseInt(req.query.page) || 1; // 페이지 번호, 기본값 1
    const PAGE_SIZE = 20; // 페이지 크기
    const offset = (page - 1) * PAGE_SIZE;

    if(page < 1){
        return error(res, "부적절한 페이지 값", null, 400);
    }

    try {
        // 조건에 맞는 공고 조회
        const [payJobs] = await executeQuery(
            `SELECT 
            j.job_posting_id,
            j.title,
            c.company_name,
            j.salary,
            j.link,
            j.deadline,
            j.views,
            GROUP_CONCAT(DISTINCT l.location_name SEPARATOR ', ') AS locations,
            GROUP_CONCAT(DISTINCT s.sector_name SEPARATOR ', ') AS sectors,
            GROUP_CONCAT(DISTINCT et.employment_type_name SEPARATOR ', ') AS employment_types
            FROM job_postings j
            JOIN companies c ON j.company_id = c.company_id
            LEFT JOIN job_posting_locations jl ON j.job_posting_id = jl.job_posting_id
            LEFT JOIN locations l ON jl.location_id = l.location_id
            LEFT JOIN job_posting_sectors js ON j.job_posting_id = js.job_posting_id
            LEFT JOIN sectors s ON js.sector_id = s.sector_id
            LEFT JOIN job_posting_employment_types je ON j.job_posting_id = je.job_posting_id
            LEFT JOIN employment_types et ON je.employment_type_id = et.employment_type_id
            WHERE j.salary LIKE '%만원'
            AND LENGTH(REPLACE(REPLACE(j.salary, ',', ''), '만원', '')) > 0
            AND CAST(REPLACE(REPLACE(j.salary, ',', ''), '만원', '') AS UNSIGNED) >= 1000
            GROUP BY j.job_posting_id
            ORDER BY CAST(REPLACE(REPLACE(j.salary, ',', ''), '만원', '') AS UNSIGNED) DESC
            LIMIT ? OFFSET ?`,
            [PAGE_SIZE, offset]
        );


        // 시급, 일급, 월급 등의 정보가 있으므로 이를 고려 연봉 정보를 가진 공고만을 가져옴
        // n원 제외 및 1,000 만원 이상만, ","는 제거하여 숫자로 비교
        const [totalCountResult] = await executeQuery(
            `SELECT COUNT(*) AS totalCount
            FROM job_postings j
            WHERE j.salary LIKE '%만원'
            AND LENGTH(REPLACE(REPLACE(j.salary, ',', ''), '만원', '')) > 0
            AND CAST(REPLACE(REPLACE(j.salary, ',', ''), '만원', '') AS UNSIGNED) >= 1000;
            `,[]
        );

        const totalItems = totalCountResult[0].totalCount;

        // 반환할 데이터 형식 정제
        const formattedRows = payJobs.map(row => ({
            job_posting_id: row.job_posting_id,
            title: row.title,
            company_name: row.company_name,
            salary: row.salary,
            link: row.link,
            deadline: row.deadline,
            views: row.views,
            locations: row.locations ? row.locations.split(', ') : [],
            sectors: row.sectors ? row.sectors.split(', ') : [],
            employment_types: row.employment_types ? row.employment_types.split(', ') : []
        }));

        // 페이지네이션 데이터 생성
        const pagination = {
            currentPage: page,
            totalPages: Math.ceil(totalItems / PAGE_SIZE),
            pageSize: PAGE_SIZE,
            totalItems: totalItems,
        };

        // 요청된 페이지가 유효하지 않은 경우
        if (page > pagination.totalPages || page < 1) {
            return error(res, "부적절한 페이지 값", null, 400);
        }

        // 데이터 반환
        success(res, "급여 순 공고 조회 성공", formattedRows, pagination);
    } catch (err) {
        error(res, "급여 순 공고 조회 실패", err, 500);
    }
});



module.exports = router;
