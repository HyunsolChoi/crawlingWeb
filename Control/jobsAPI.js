const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const {success, error} = require('../View/response');
const { executeQuery, executeTransaction } = require('../Model/executeDB');

/**
 * @swagger
 * paths:
 *  /jobs:
 *    post:
 *      summary: "공고 조회"
 *      description: " keyword 값을 통해 검색, 그 외 옵션으로 필터 및 정렬 옵션을 사용하여 공고 데이터를 조회합니다. 각 항목은 모두 선택 사항입니다."
 *      tags: [Jobs]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                page:
 *                  type: integer
 *                  description: "현재 페이지 번호 (기본값: 1) (선택 사항)"
 *                  example: 1
 *                sort:
 *                  type: string
 *                  description: "정렬 기준 (예: created_at DESC) (선택 사항)"
 *                  example: "created_at DESC"
 *                location:
 *                  type: integer
 *                  description: "위치 ID (선택 사항)"
 *                  example: 3
 *                experience:
 *                  type: integer
 *                  description: "경력 ID (선택 사항)"
 *                  example: 2
 *                sector:
 *                  type: integer
 *                  description: "직무 분야(섹터) ID (선택 사항)"
 *                  example: 4
 *                keyword:
 *                  type: string
 *                  description: "공고 제목 또는 회사명 검색 키워드 (선택 사항)"
 *                  example: "개발"
 *                company:
 *                  type: string
 *                  description: "회사 이름 (선택 사항)"
 *                  example: "Tech Corp"
 *      responses:
 *        200:
 *          description: "공고 조회 성공"
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
 *                    example: "공고 조회 성공"
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
 *                          example: "소프트웨어 개발자 채용"
 *                        company_name:
 *                          type: string
 *                          example: "SW 개발사"
 *                        salary:
 *                          type: string
 *                          example: "3,500 만원"
 *                        link:
 *                          type: string
 *                          example: "https://example.com/job/1"
 *                        deadline:
 *                          type: string
 *                          format: date
 *                          example: "2024-12-31"
 *                        locations:
 *                          type: array
 *                          items:
 *                            type: string
 *                          example: ["서울 강남구", "서울"]
 *                        sectors:
 *                          type: array
 *                          items:
 *                            type: string
 *                          example: ["IT", "소프트웨어"]
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
 *          description: "부합한 공고가 없습니다."
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
 *                    example: "부합한 공고가 없습니다."
 *                  code:
 *                    type: integer
 *                    example: 404
 *        500:
 *          description: "공고 조회 실패"
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
 *                    example: "공고 조회 실패"
 *                  code:
 *                    type: integer
 *                    example: 500
 *                  error:
 *                    type: string
 *                    example: "Error Message"
 */

/**
 * 공고 조회 API
 *
 * @route POST /jobs
 * @summary 공고 조회
 * @description 필터 및 정렬 옵션을 사용하여 공고 데이터를 조회합니다.
 * @param {Object} req - 요청 객체
 * @param {Object} req.body - 요청 본문
 * @param {number} [req.body.page=1] - 현재 페이지 번호 (기본값: 1)
 * @param {string} [req.body.sort] - 정렬 기준 (예: "salary DESC")
 * @param {number} [req.body.location] - 위치 ID
 * @param {number} [req.body.experience] - 경력 ID
 * @param {number} [req.body.sector] - 직무 분야(섹터) ID
 * @param {string} [req.body.keyword] - 공고 제목 또는 회사명 검색 키워드
 * @param {string} [req.body.company] - 회사 이름
 * @param {Object} res - 응답 객체
 * @returns {Object} 공고 데이터와 페이지네이션 정보
 *
 * @throws {Error} 400 - 페이지 값이 부적절한 경우
 * 반환 형식:
 * {
 *   "status": "error",
 *   "message": "부적절한 페이지 값",
 *   "code": 400
 * }
 * @throws {Error} 404 - 부합한 공고가 없는 경우
 * 반환 형식:
 * {
 *   "status": "error",
 *   "message": "부합한 공고가 없습니다.",
 *   "code": 404
 * }
 * @throws {Error} 500 - 공고 조회 중 서버 오류 발생
 * 반환 형식:
 * {
 *   "status": "error",
 *   "message": "공고 조회 실패",
 *   "code": 500,
 *   "error": "에러 메시지"
 * }
 */
router.post('/', async (req, res) => {
    // 요청 본문에서 파라미터 추출, 기본값 설정
    const { page = 1, sort, location, experience, sector, keyword, company } = req.body;

    if(page < 1){
        return error(res, "부적절한 페이지 값", null, 400);
    }

    // 페이지네이션 관련 상수
    const PAGE_SIZE = 20; // 페이지당 데이터 개수
    const offset = (page - 1) * PAGE_SIZE; // 페이지 오프셋 계산

    try {
        // 기본 SQL 쿼리 (필터링과 결합될 부분)
        let baseQuery = `
        FROM job_postings j
        JOIN companies c ON j.company_id = c.company_id
        LEFT JOIN job_posting_sectors js ON j.job_posting_id = js.job_posting_id
        LEFT JOIN sectors s ON js.sector_id = s.sector_id
        LEFT JOIN job_posting_employment_types je ON j.job_posting_id = je.job_posting_id
        LEFT JOIN employment_types et ON je.employment_type_id = et.employment_type_id
        LEFT JOIN job_posting_locations jl ON j.job_posting_id = jl.job_posting_id
        LEFT JOIN locations l ON jl.location_id = l.location_id
        `;

        const params = []; // SQL 쿼리 파라미터 배열
        const filters = []; // WHERE 조건을 저장할 배열

        // 위치 필터 추가
        if (location) {
            filters.push('jl.location_id = ?');
            params.push(location);
        }

        // 경력 필터 추가
        if (experience) {
            baseQuery += ' JOIN job_posting_experiences jexp ON j.job_posting_id = jexp.job_posting_id';
            filters.push('jexp.experience_id = ?');
            params.push(experience);
        }

        // 직무 분야(섹터) 필터 추가
        if (sector) {
            filters.push('s.sector_id = ?');
            params.push(sector);
        }

        // 키워드(공고 제목, 회사명) 필터 추가
        if (keyword) {
            filters.push('(j.title LIKE ? OR c.company_name LIKE ?)');
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        // 회사 이름 필터 추가
        if (company) {
            filters.push('c.company_name LIKE ?');
            params.push(`%${company}%`);
        }

        // WHERE 절 생성 (필터가 있을 경우에만 추가)
        if (filters.length > 0) {
            baseQuery += ` WHERE ${filters.join(' AND ')}`;
        }

        // 총 데이터 개수 계산 쿼리
        const totalCountQuery = `SELECT COUNT(DISTINCT j.job_posting_id) AS totalCount ${baseQuery}`;
        const totalCountResult = await executeQuery(totalCountQuery, params);

        const totalCount = totalCountResult?.[0]?.[0]?.totalCount || 0;

        //console.log(totalCount);
        // 데이터가 없을 경우
        if (totalCount === 0) {
            return error(res, "부합한 공고가 없습니다.", null, 404);
        }

        // 실제 데이터 조회 쿼리
        let dataQuery = `
        SELECT 
            j.job_posting_id,
            j.title,
            c.company_name,
            j.salary,
            j.link,
            j.deadline,
            GROUP_CONCAT(DISTINCT s.sector_name SEPARATOR ', ') AS sectors,
            GROUP_CONCAT(DISTINCT l.location_name SEPARATOR ', ') AS locations,
            GROUP_CONCAT(DISTINCT et.employment_type_name SEPARATOR ', ') AS employment_types
        ${baseQuery}
        GROUP BY j.job_posting_id, j.title, c.company_name, j.salary, j.link, j.deadline
        `;

        // 정렬 조건 추가
        if (sort) {
            dataQuery += ` ORDER BY ${sort}, j.job_posting_id ASC`;
        } else {
            dataQuery += ' ORDER BY j.created_at DESC, j.job_posting_id ASC';
        }

        // 페이지네이션 추가
        dataQuery += ' LIMIT ? OFFSET ?';
        params.push(PAGE_SIZE, offset);

        // 데이터 조회 실행
        const [rows] = await executeQuery(dataQuery, params);

        // 반환용 페이지 정보 생성
        const pagination = {
            currentPage: page,
            totalPages: Math.ceil(totalCount / PAGE_SIZE),
            pageSize: PAGE_SIZE,
            totalItems: totalCount,
        };

        // 반환용 데이터 거름망
        const formattedRows = rows.map(row => ({
            job_posting_id: row.job_posting_id,
            title: row.title,
            company_name: row.company_name,
            salary: row.salary,
            link: row.link,
            deadline: row.deadline,
            locations: row.locations ? row.locations.split(', ') : [],
            sectors: row.sectors ? row.sectors.split(', ') : [],
        }));

        // 요청 페이지가 유효 범위 벗어나는 경우
        if(page > pagination.totalPages || page < 1){
            return error(res, "부적절한 페이지 값", null, 400);
        }

        // 응답 데이터 구성
        success(res, "공고 조회 성공", formattedRows, pagination);
    } catch (err) {
        // 에러 처리
        error(res, "공고 조회 실패", err, 500);
    }
});


/**
 * @swagger
 * paths:
 *  /jobs/create:
 *    post:
 *      summary: "채용 공고 등록"
 *      description: "사용자가 채용 공고를 등록합니다. 등록 시 중복 확인 및 관련 데이터를 동적으로 생성합니다."
 *      tags: [Jobs]
 *      security:
 *        - bearerAuth: []  # Bearer 인증 사용
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                companyName:
 *                  type: string
 *                  description: "회사 이름"
 *                  example: "예시 기업"
 *                title:
 *                  type: string
 *                  description: "채용 공고 제목"
 *                  example: "백엔드 / 프론트엔드 개발자 채용"
 *                link:
 *                  type: string
 *                  description: "채용 공고 링크"
 *                  example: "https://example.com/job/12345"
 *                educationLevel:
 *                  type: string
 *                  description: "요구 학력 수준"
 *                  example: "대졸 이상"
 *                deadline:
 *                  type: string
 *                  format: date
 *                  description: "지원 마감일"
 *                  example: "2024-12-31"
 *                locationNames:
 *                  type: array
 *                  description: "공고와 연관된 위치 이름들"
 *                  items:
 *                    type: string
 *                  example: ["판교", "성남"]
 *                sectorNames:
 *                  type: array
 *                  description: "공고와 연관된 분야 이름들"
 *                  items:
 *                    type: string
 *                  example: ["IT", "개발자"]
 *                employmentType:
 *                  type: string
 *                  description: "고용 형태"
 *                  example: "정규직"
 *                salary:
 *                  type: string
 *                  description: "급여 정보 (선택 사항)"
 *                  example: "3,000 만원"
 *      responses:
 *        201:
 *          description: "채용 공고 등록 성공"
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
 *                    example: "채용 공고가 성공적으로 등록되었습니다."
 *                  data:
 *                    type: object
 *                    properties:
 *                      title:
 *                        type: string
 *                        example: "백엔드 개발자 채용"
 *                      company_name:
 *                        type: string
 *                        example: "OpenAI"
 *                      salary:
 *                        type: string
 *                        example: "5000만원"
 *                      deadline:
 *                        type: string
 *                        format: date
 *                        example: "~12/31(화)"
 *                      education_level:
 *                        type: string
 *                        example: "대졸 이상"
 *                      locations:
 *                        type: array
 *                        items:
 *                          type: string
 *                        example: ["서울", "경기"]
 *                      sectors:
 *                        type: array
 *                        items:
 *                          type: string
 *                        example: ["IT", "소프트웨어"]
 *                      employment_type_name:
 *                        type: string
 *                        example: "정규직"
 *                      created_at:
 *                        type: string
 *                        format: date-time
 *                        example: "2023-12-10T12:34:56.000Z"
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
 *                    example: "job_posting_id를 가져올 수 없습니다."
 *                  code:
 *                    type: integer
 *                    example: 400
 *              examples:
 *                missingJobPostingId:
 *                  summary: "공고 id를 찾을 수 없음"
 *                  value:
 *                    status: "error"
 *                    message: "job_posting_id를 가져올 수 없습니다."
 *                    code: 400
 *                missingFields:
 *                  summary: "필수 필드 누락"
 *                  value:
 *                    status: "error"
 *                    message: "모든 필수 필드를 입력해야 합니다."
 *                    code: 400
 *        409:
 *          description: "중복된 채용 공고"
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
 *                    example: "이미 등록된 채용 공고입니다."
 *                  code:
 *                    type: integer
 *                    example: 409
 *        500:
 *          description: "서버 오류로 인해 등록 실패"
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
 *                    example: "채용 공고 등록 실패"
 *                  code:
 *                    type: integer
 *                    example: 500
 *                  error:
 *                    type: string
 */

/**
 * 채용 공고 등록 API
 *
 * @route POST /jobs/create
 * @summary 채용 공고 등록
 * @description 사용자가 입력한 정보를 바탕으로 채용 공고를 등록합니다. 중복된 데이터 확인 및 관련 데이터를 동적으로 생성합니다.
 * @param {Object} req - 요청 객체
 * @param {Object} req.body - 요청 본문
 * @param {string} req.body.companyName - 회사 이름
 * @param {string} req.body.title - 채용 공고 제목
 * @param {string} req.body.link - 채용 공고 링크
 * @param {string} req.body.educationLevel - 요구 학력 수준
 * @param {string} req.body.deadline - 지원 마감일
 * @param {Array<string>} req.body.locationNames - 지역 이름 배열
 * @param {Array<string>} req.body.sectorNames - 분야 이름 배열
 * @param {string} req.body.employmentType - 고용 형태
 * @param {string} [req.body.salary] - 급여 정보 (선택 사항)
 * @param {Object} res - 응답 객체
 * @returns {Object} 성공 메시지와 등록된 데이터 정보 반환
 *
 * @throws {Error} 400 - 필수 필드 누락
 * 반환 형식:
 * {
 *   "status": "error",
 *   "message": "모든 필수 필드를 입력해야 합니다.",
 *   "code": 400
 * }
 * @throws {Error} 409 - 중복된 채용 공고
 * 반환 형식:
 * {
 *   "status": "error",
 *   "message": "이미 등록된 채용 공고입니다.",
 *   "code": 409
 * }
 * @throws {Error} 500 - 서버 오류로 인해 등록 실패
 * 반환 형식:
 * {
 *   "status": "error",
 *   "message": "채용 공고 등록 실패",
 *   "error": "에러 메시지",
 *   "code": 500
 * }
 */
router.post('/create', async (req, res) => {
    const { companyName, title, link, educationLevel, deadline, locationNames, sectorNames, employmentType, salary } = req.body;
    const userId = req.user.userId;

    if (!companyName || !title || !link || !educationLevel || !deadline || !locationNames || !sectorNames || !employmentType) {
        return error(res, '모든 필수 필드를 입력해야 합니다.', null, 400);
    }

    try {
        const queries = [];

        // 중복 공고 확인
        queries.push({
            query: `SELECT job_posting_id FROM job_postings WHERE REPLACE(title, ' ', '') = REPLACE(?, ' ', '') AND REPLACE(link, ' ', '') = REPLACE(?, ' ', '')`,
            params: [title, link]
        });

        // 회사 추가 또는 ID 조회
        queries.push({
            query: `INSERT INTO companies (company_name) VALUES (?) ON DUPLICATE KEY UPDATE company_id=LAST_INSERT_ID(company_id)`,
            params: [companyName]
        });

        // 학력 추가 또는 ID 조회
        queries.push({
            query: `INSERT INTO educations (education_level) VALUES (?) ON DUPLICATE KEY UPDATE education_id=LAST_INSERT_ID(education_id)`,
            params: [educationLevel]
        });

        // 고용 형태 추가 또는 ID 조회
        queries.push({
            query: `INSERT INTO employment_types (employment_type_name) VALUES (?) ON DUPLICATE KEY UPDATE employment_type_id=LAST_INSERT_ID(employment_type_id)`,
            params: [employmentType]
        });

        // 채용 공고 등록
        const linkHash = crypto.createHash('sha256').update(link).digest('hex');
        queries.push({
            query: `INSERT INTO job_postings (user_id, company_id, title, link, link_hash, education_id, deadline, employment_type_id, salary) VALUES (?, LAST_INSERT_ID(), ?, ?, ?, LAST_INSERT_ID(), ?, LAST_INSERT_ID(), ?)`,
            params: [userId, title, link, linkHash, deadline, salary || '추후 협의']
        });

        const results = await executeTransaction(queries);

        // `job_posting_id` 추출
        const jobPostingId = results[results.length - 1]?.insertId;
        if (!jobPostingId) {
            return error(res,'job_posting_id를 가져올 수 없습니다.', null, 400);
        }

        // 지역 매핑
        for (const locationName of locationNames) {
            await executeTransaction([
                {
                    query: `INSERT INTO locations (location_name) VALUES (?) ON DUPLICATE KEY UPDATE location_id=LAST_INSERT_ID(location_id)`,
                    params: [locationName]
                },
                {
                    query: `INSERT INTO job_posting_locations (job_posting_id, location_id) VALUES (?, LAST_INSERT_ID())`,
                    params: [jobPostingId]
                }
            ]);
        }

        // 분야 매핑
        for (const sectorName of sectorNames) {
            await executeTransaction([
                {
                    query: `INSERT INTO sectors (sector_name) VALUES (?) ON DUPLICATE KEY UPDATE sector_id=LAST_INSERT_ID(sector_id)`,
                    params: [sectorName]
                },
                {
                    query: `INSERT INTO job_posting_sectors (job_posting_id, sector_id) VALUES (?, LAST_INSERT_ID())`,
                    params: [jobPostingId]
                }
            ]);
        }

        success(res, '채용 공고가 성공적으로 등록되었습니다.', { jobPostingId }, null, true);
    } catch (err) {
        error(res, '채용 공고 등록 실패', err, 500);
    }
});




/**
 * @swagger
 * paths:
 *   /jobs/sectors:
 *     post:
 *       summary: "직무 관련 공고 조회"
 *       description: "키워드를 기반으로 직무 관련 공고를 조회합니다."
 *       tags: [Jobs]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 keyword:
 *                   type: string
 *                   description: "검색할 직무 키워드"
 *                   example: "개발"
 *                 page:
 *                   type: integer
 *                   description: "조회할 페이지 번호 (기본값: 1)"
 *                   example: 1
 *       responses:
 *         200:
 *           description: "직무 관련 공고 조회 성공"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     example: "success"
 *                   message:
 *                     type: string
 *                     example: "직무 관련 공고 조회 성공"
 *                   data:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         job_posting_id:
 *                           type: integer
 *                           example: 123
 *                         title:
 *                           type: string
 *                           example: "백엔드 개발자 채용"
 *                         company_name:
 *                           type: string
 *                           example: "(주)테크스타트"
 *                         salary:
 *                           type: string
 *                           example: "추후 협의"
 *                         link:
 *                           type: string
 *                           example: "https://example.com/job/123"
 *                         deadline:
 *                           type: string
 *                           example: "2024-12-31"
 *                         locations:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["서울", "경기"]
 *                         sectors:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["백엔드 개발", "데이터 엔지니어"]
 *                   pagination:
 *                     type: object
 *                     properties:
 *                       currentPage:
 *                         type: integer
 *                         example: 1
 *                       totalPages:
 *                         type: integer
 *                         example: 5
 *                       pageSize:
 *                         type: integer
 *                         example: 20
 *                       totalItems:
 *                         type: integer
 *                         example: 100
 *         400:
 *           description: "잘못된 요청"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     example: "error"
 *                   message:
 *                     type: string
 *                     example: "키워드는 필수입니다."
 *                   code:
 *                     type: integer
 *                     example: 400
 *               examples:
 *                 missingKeyword:
 *                   summary: "키워드 누락"
 *                   value:
 *                     status: "error"
 *                     message: "키워드는 필수입니다."
 *                     code: 400
 *                 invalidPageValue:
 *                   summary: "부적절한 페이지 값"
 *                   value:
 *                     status: "error"
 *                     message: "부적절한 페이지 값"
 *                     code: 400
 *         404:
 *           description: "직무 관련 공고 없음"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     example: "error"
 *                   message:
 *                     type: string
 *                     example: "해당 직무 관련 공고가 없습니다."
 *                   code:
 *                     type: integer
 *                     example: 404
 *         505:
 *           description: "서버 오류"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     example: "error"
 *                   message:
 *                     type: string
 *                     example: "직무 관련 공고 조회 실패"
 *                   code:
 *                     type: integer
 *                     example: 505
 *                   error:
 *                     type: string
 */

/**
 * 직무 관련 공고를 조회합니다.
 * 추후에 공고별로 조회하는 기능에 활용
 * @route POST /jobs/sectors
 * @param {object} req - 요청 객체
 * @param {object} res - 응답 객체
 * @body {string} keyword - 검색할 직무 키워드 (필수)
 * @body {integer} [page=1] - 조회할 페이지 번호 (기본값: 1)
 * @returns {object} 200 - 조회 성공 시 직무 관련 공고 데이터와 페이지 정보
 * @returns {object} 400 - 키워드가 없는 잘못된 요청, 페이지값이 부적절한 경우
 * @returns {object} 404 - 직무 관련 공고가 없을 경우
 * @returns {object} 505 - 서버 오류 발생 시
 */
router.post('/sectors', async (req, res) => {
    const { keyword, page = 1 } = req.body;

    if(page < 1){
        return error(res, "부적절한 페이지 값", null, 400);
    }

    if (!keyword) {
        return error(res, '키워드는 필수입니다.', null, 400);
    }

    const PAGE_SIZE = 20;
    const offset = (page - 1) * PAGE_SIZE;

    try {
        const countQuery = `
            SELECT COUNT(DISTINCT jp.job_posting_id) AS totalCount
            FROM job_postings jp
            JOIN job_posting_sectors jps ON jp.job_posting_id = jps.job_posting_id
            JOIN sectors s ON jps.sector_id = s.sector_id
            WHERE s.sector_name LIKE ?;
        `;

        // 공고의 수
        const countResult = await executeQuery(countQuery, [`%${keyword}%`]);
        const totalCount = countResult?.[0]?.[0]?.totalCount || 0;

        // 공고가 없으면 에러 반환
        if (totalCount === 0) {
            return error(res, '해당 직무 관련 공고가 없습니다.', null, 404);
        }

        const query = `
            SELECT 
                jp.job_posting_id,
                jp.title,
                c.company_name,
                jp.salary,
                jp.link,
                jp.deadline,
                GROUP_CONCAT(DISTINCT l.location_name SEPARATOR ', ') AS locations,
                GROUP_CONCAT(DISTINCT s.sector_name SEPARATOR ', ') AS sectors
            FROM job_postings jp
            JOIN job_posting_sectors jps ON jp.job_posting_id = jps.job_posting_id
            JOIN sectors s ON jps.sector_id = s.sector_id
            JOIN companies c ON jp.company_id = c.company_id
            LEFT JOIN job_posting_locations jpl ON jp.job_posting_id = jpl.job_posting_id
            LEFT JOIN locations l ON jpl.location_id = l.location_id
            WHERE s.sector_name LIKE ?
            GROUP BY jp.job_posting_id, jp.title, c.company_name, jp.salary, jp.link, jp.deadline
            LIMIT ? OFFSET ?;
        `;

        // SQL 실행 결과 반환 및 출력을 위한 필터링
        const [rows] = await executeQuery(query, [`%${keyword}%`, PAGE_SIZE, offset]);

        const formattedRows = rows.map(row => ({
            job_posting_id: row.job_posting_id,
            title: row.title,
            company_name: row.company_name,
            salary: row.salary,
            link: row.link,
            deadline: row.deadline,
            locations: row.locations ? row.locations.split(', ') : [],
            sectors: row.sectors ? row.sectors.split(', ') : [],
        }));

        // 반환용 페이지 정보 생성
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

        success(res, "직무 관련 공고 조회 성공", formattedRows, pagination);
    } catch (err) {
        error(res, '직무 관련 공고 조회 실패', err, 505);
    }
});


/**
 * @swagger
 * /jobs/{id}:
 *   put:
 *     summary: "채용 공고 수정"
 *     description: "지정된 ID의 채용 공고를 수정합니다."
 *     tags:
 *       - Jobs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: "수정할 채용 공고의 ID"
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *                 description: "회사 이름 (선택 사항)"
 *                 example: "OpenAI"
 *               title:
 *                 type: string
 *                 description: "공고 제목 (선택 사항)"
 *                 example: "백엔드 개발자 채용"
 *               link:
 *                 type: string
 *                 description: "공고 링크 (선택 사항)"
 *                 example: "https://example.com/job/12345"
 *               educationLevel:
 *                 type: string
 *                 description: "학력 요구사항 (선택 사항)"
 *                 example: "대졸 이상"
 *               deadline:
 *                 type: string
 *                 description: "마감 기한 (선택 사항)"
 *                 format: date
 *                 example: "2024-12-31"
 *               locationNames:
 *                 type: array
 *                 description: "지역 이름 목록 (선택 사항)"
 *                 items:
 *                   type: string
 *                 example: ["서울", "경기"]
 *               sectorNames:
 *                 type: array
 *                 description: "직무 분야 이름 목록 (선택 사항)"
 *                 items:
 *                   type: string
 *                 example: ["IT", "소프트웨어"]
 *               employmentType:
 *                 type: string
 *                 description: "고용 형태 (선택 사항)"
 *                 example: "정규직"
 *               salary:
 *                 type: string
 *                 description: "급여 정보 (선택 사항)"
 *                 example: "7,000 만원"
 *     responses:
 *       200:
 *         description: "채용 공고 수정 성공"
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
 *                   example: "공고가 성공적으로 수정되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "백엔드 개발자 채용"
 *                     company_name:
 *                       type: string
 *                       example: "OpenAI"
 *                     salary:
 *                       type: string
 *                       example: "7,000 만원"
 *                     deadline:
 *                       type: string
 *                       format: date
 *                       example: "2024-12-31"
 *                     education_level:
 *                       type: string
 *                       example: "대졸 이상"
 *                     locations:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["서울", "경기"]
 *                     sectors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["IT", "소프트웨어"]
 *                     employment_type_name:
 *                       type: string
 *                       example: "정규직"
 *                     last_modified_date:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T12:34:56.000Z"
 *       400:
 *         description: "잘못된 요청"
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
 *                   example: "수정할 필드를 입력해주세요."
 *                 code:
 *                   type: integer
 *                   example: 400
 *       403:
 *         description: "권한 없음"
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
 *                   example: "해당 공고를 수정할 권한이 없습니다."
 *                 code:
 *                   type: integer
 *                   example: 403
 *       404:
 *         description: "공고가 존재하지 않음"
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
 *                   example: "수정하려는 공고가 존재하지 않습니다."
 *                 code:
 *                   type: integer
 *                   example: 404
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
 *                   example: "공고 수정 실패"
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */

/**
 * @function
 * @name updateJobPosting
 * @description 지정된 ID의 채용 공고를 수정합니다.
 * @route PUT /jobs/:id
 * @param {Object} req - 요청 객체
 * @param {Object} req.params - URL 경로 매개변수
 * @param {number} req.params.id - 수정할 공고의 ID
 * @param {Object} req.body - 요청 본문
 * @param {string} [req.body.companyName] - 회사 이름 (선택 사항)
 * @param {string} [req.body.title] - 공고 제목 (선택 사항)
 * @param {string} [req.body.link] - 공고 링크 (선택 사항)
 * @param {string} [req.body.educationLevel] - 학력 요구사항 (선택 사항)
 * @param {string} [req.body.deadline] - 마감 기한 (선택 사항, yyyy-mm-dd 형식)
 * @param {string[]} [req.body.locationNames] - 지역 이름 목록 (선택 사항)
 * @param {string[]} [req.body.sectorNames] - 직무 분야 이름 목록 (선택 사항)
 * @param {string} [req.body.employmentType] - 고용 형태 (선택 사항)
 * @param {string} [req.body.salary] - 급여 정보 (선택 사항)
 * @param {Object} res - 응답 객체
 * @returns {void} 응답 객체에 성공 또는 오류 상태를 반환
 * @throws {Error} 400 - 잘못된 요청 (수정할 필드 없음)
 * @throws {Error} 403 - 권한 없음 (해당 공고를 수정할 권한 없음)
 * @throws {Error} 404 - 공고가 존재하지 않음
 * @throws {Error} 500 - 서버 오류
 * @example
 * // 성공 시 응답 예제
 * {
 *   "status": "success",
 *   "message": "공고가 성공적으로 수정되었습니다.",
 *   "data": {
 *     "title": "백엔드 개발자 채용",
 *     "company_name": "OpenAI",
 *     "salary": "7,000 만원",
 *     "deadline": "2024-12-31",
 *     "education_level": "대졸 이상",
 *     "locations": ["서울", "경기"],
 *     "sectors": ["IT", "소프트웨어"],
 *     "employment_type_name": "정규직",
 *     "last_modified_date": "2024-01-01T12:34:56.000Z"
 *   }
 * }
 * @example
 * // 400 오류 예제
 * {
 *   "status": "error",
 *   "message": "수정할 필드를 입력해주세요.",
 *   "code": 400
 * }
 * @example
 * // 403 오류 예제
 * {
 *   "status": "error",
 *   "message": "해당 공고를 수정할 권한이 없습니다.",
 *   "code": 403
 * }
 * @example
 * // 404 오류 예제
 * {
 *   "status": "error",
 *   "message": "수정하려는 공고가 존재하지 않습니다.",
 *   "code": 404
 * }
 * @example
 * // 500 오류 예제
 * {
 *   "status": "error",
 *   "message": "공고 수정 실패",
 *   "code": 500,
 *   "error": "서버 내부 오류 메시지"
 * }
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { companyName, title, link, educationLevel, deadline, locationNames, sectorNames, employmentType, salary } = req.body;
    const userId = req.user.userId;

    if (
        !companyName &&
        !title &&
        !link &&
        !educationLevel &&
        !deadline &&
        !locationNames &&
        !sectorNames &&
        !employmentType &&
        !salary
    ) {
        return error(res, '수정할 필드를 입력해주세요.', null, 400);
    }

    try {
        const queries = [];

        // 공고 존재 여부 확인
        queries.push({
            query: `SELECT job_posting_id FROM job_postings WHERE job_posting_id = ?`,
            params: [id]
        });

        // 공고 소유권 확인
        queries.push({
            query: `SELECT * FROM job_postings WHERE job_posting_id = ? AND user_id = ?`,
            params: [id, userId]
        });

        // 기업명 수정
        if (companyName) {
            queries.push({
                query: `INSERT INTO companies (company_name) VALUES (?) ON DUPLICATE KEY UPDATE company_id=LAST_INSERT_ID(company_id)`,
                params: [companyName]
            });
            queries.push({
                query: `UPDATE job_postings SET company_id = LAST_INSERT_ID() WHERE job_posting_id = ?`,
                params: [id]
            });
        }

        // 제목 수정
        if (title) {
            queries.push({
                query: `UPDATE job_postings SET title = ? WHERE job_posting_id = ?`,
                params: [title, id]
            });
        }

        // 링크 수정
        if (link) {
            queries.push({
                query: `UPDATE job_postings SET link = ? WHERE job_posting_id = ?`,
                params: [link, id]
            });
        }

        // 학력 수정
        if (educationLevel) {
            queries.push({
                query: `INSERT INTO educations (education_level) VALUES (?) ON DUPLICATE KEY UPDATE education_id=LAST_INSERT_ID(education_id)`,
                params: [educationLevel]
            });
            queries.push({
                query: `UPDATE job_postings SET education_id = LAST_INSERT_ID() WHERE job_posting_id = ?`,
                params: [id]
            });
        }

        // 마감일 수정
        if (deadline) {
            queries.push({
                query: `UPDATE job_postings SET deadline = ? WHERE job_posting_id = ?`,
                params: [deadline, id]
            });
        }

        // 고용 형태 수정
        if (employmentType) {
            queries.push({
                query: `INSERT INTO employment_types (employment_type_name) VALUES (?) ON DUPLICATE KEY UPDATE employment_type_id=LAST_INSERT_ID(employment_type_id)`,
                params: [employmentType]
            });
            queries.push({
                query: `UPDATE job_postings SET employment_type_id = LAST_INSERT_ID() WHERE job_posting_id = ?`,
                params: [id]
            });
        }

        // 급여 수정
        if (salary) {
            queries.push({
                query: `UPDATE job_postings SET salary = ? WHERE job_posting_id = ?`,
                params: [salary, id]
            });
        }

        // 지역 매핑 수정
        if (locationNames) {
            queries.push({
                query: `DELETE FROM job_posting_locations WHERE job_posting_id = ?`,
                params: [id]
            });

            locationNames.forEach(locationName => {
                queries.push({
                    query: `INSERT INTO locations (location_name) VALUES (?) ON DUPLICATE KEY UPDATE location_id=LAST_INSERT_ID(location_id)`,
                    params: [locationName]
                });
                queries.push({
                    query: `INSERT INTO job_posting_locations (job_posting_id, location_id) VALUES (?, LAST_INSERT_ID())`,
                    params: [id]
                });
            });
        }

        // 분야 매핑 수정
        if (sectorNames) {
            queries.push({
                query: `DELETE FROM job_posting_sectors WHERE job_posting_id = ?`,
                params: [id]
            });

            sectorNames.forEach(sectorName => {
                queries.push({
                    query: `INSERT INTO sectors (sector_name) VALUES (?) ON DUPLICATE KEY UPDATE sector_id=LAST_INSERT_ID(sector_id)`,
                    params: [sectorName]
                });
                queries.push({
                    query: `INSERT INTO job_posting_sectors (job_posting_id, sector_id) VALUES (?, LAST_INSERT_ID())`,
                    params: [id]
                });
            });
        }

        // 마지막 수정일 업데이트
        queries.push({
            query: `UPDATE job_postings SET last_modified_date = CURRENT_TIMESTAMP WHERE job_posting_id = ?`,
            params: [id]
        });

        // 데이터 수정, 문제 발생 시 롤백을 위해 별도로 실행
        await executeTransaction(queries);

        // 수정된 데이터 조회
        const [updatedJob] = await executeQuery(`
            SELECT
            j.title,
            c.company_name,
            j.salary,
            j.deadline,
            e.education_level,
            GROUP_CONCAT(DISTINCT l.location_name) AS locations,
            GROUP_CONCAT(DISTINCT s.sector_name) AS sectors,
            et.employment_type_name,
            j.last_modified_date
            FROM job_postings j
            JOIN companies c ON j.company_id = c.company_id
            JOIN educations e ON j.education_id = e.education_id
            LEFT JOIN job_posting_locations jl ON j.job_posting_id = jl.job_posting_id
            LEFT JOIN locations l ON jl.location_id = l.location_id
            LEFT JOIN job_posting_sectors js ON j.job_posting_id = js.job_posting_id
            LEFT JOIN sectors s ON js.sector_id = s.sector_id
            LEFT JOIN employment_types et ON j.employment_type_id = et.employment_type_id
            WHERE j.job_posting_id = ?`,[id]
        );

        if (updatedJob) {
            updatedJob.locations = updatedJob.locations ? updatedJob.locations.split(',') : [];
            updatedJob.sectors = updatedJob.sectors ? updatedJob.sectors.split(',') : [];
        }

        success(res, '공고가 성공적으로 수정되었습니다.', updatedJob);
    } catch (err) {
        error(res, '공고 수정 실패', err, 500);
    }
});



/**
 * @swagger
 * paths:
 *   /jobs/{id}:
 *     get:
 *       summary: "공고 상세 조회 및 관련 공고 추천"
 *       description: "특정 공고 ID를 사용하여 공고의 상세 정보 및 관련 공고를 조회합니다."
 *       tags: [Jobs]
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *           description: "조회할 공고의 ID"
 *       responses:
 *         200:
 *           description: "공고 상세 조회 성공"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     example: "success"
 *                   message:
 *                     type: string
 *                     example: "공고 상세 조회 성공"
 *                   data:
 *                     type: object
 *                     properties:
 *                       detailJob:
 *                         type: object
 *                         properties:
 *                           job_posting_id:
 *                             type: integer
 *                             example: 1
 *                           title:
 *                             type: string
 *                             example: "백엔드 개발자 채용"
 *                           company_name:
 *                             type: string
 *                             example: "OpenAI"
 *                           salary:
 *                             type: string
 *                             example: "7,000 만원"
 *                           link:
 *                             type: string
 *                             example: "https://example.com/job-posting/123"
 *                           deadline:
 *                             type: string
 *                             format: date
 *                             example: "~12/31(화)"
 *                           locations:
 *                             type: array
 *                             description: "지역 리스트"
 *                             items:
 *                               type: string
 *                             example: ["서울", "경기"]
 *                           sectors:
 *                             type: array
 *                             description: "직무 분야 리스트"
 *                             items:
 *                               type: string
 *                             example: ["IT", "소프트웨어"]
 *                           employment_types:
 *                             type: array
 *                             description: "고용 형태 리스트"
 *                             items:
 *                               type: string
 *                             example: ["정규직"]
 *                       relatedJobs:
 *                         type: array
 *                         description: "관련 추천 공고 리스트"
 *                         items:
 *                           type: object
 *                           properties:
 *                             job_posting_id:
 *                               type: integer
 *                               example: 3
 *                             title:
 *                               type: string
 *                               example: "풀스택 개발자 채용"
 *                             company_name:
 *                               type: string
 *                               example: "Amazon"
 *                             salary:
 *                               type: string
 *                               example: "3,000 만원"
 *                             link:
 *                               type: string
 *                               example: "https://example.com/job3"
 *                             deadline:
 *                               type: string
 *                               format: date
 *                               example: "~01/15(수)"
 *                             sectors:
 *                               type: array
 *                               description: "직무 분야 리스트"
 *                               items:
 *                                 type: string
 *                               example: ["풀스택", "소프트웨어"]
 *         400:
 *           description: "유효하지 않은 공고 ID"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     example: "error"
 *                   message:
 *                     type: string
 *                     example: "유효하지 않은 공고 ID입니다."
 *                   code:
 *                     type: integer
 *                     example: 400
 *         404:
 *           description: "공고 없음"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     example: "error"
 *                   message:
 *                     type: string
 *                     example: "해당 공고를 찾을 수 없습니다."
 *                   code:
 *                     type: integer
 *                     example: 404
 *         500:
 *           description: "서버 오류"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     example: "error"
 *                   message:
 *                     type: string
 *                     example: "공고 상세 조회 실패"
 *                   code:
 *                     type: integer
 *                     example: 500
 *                   error:
 *                     type: string
 *                     example: "Error message"
 */

/**
 * @route GET /jobs/:id
 * @summary Fetches detailed job posting information and related job postings.
 * @param {number} id - The ID of the job posting to retrieve.
 * @returns {Object} 200 - Job posting details and related job postings.
 * @returns {Object} 400 - Invalid job posting ID.
 * @returns {Object} 404 - Job posting not found.
 * @returns {Object} 500 - Server error.
 * @example success response - 200
 * {
 *   "status": "success",
 *   "message": "공고 상세 조회 성공",
 *   "data": {
 *     "detailJob": {
 *       "job_posting_id": 123,
 *       "title": "백엔드 개발자",
 *       "company_name": "OpenAI",
 *       "salary": "3,000 만원",
 *       "link": "https://example.com",
 *       "deadline": "2024-12-31",
 *       "locations": ["서울", "경기"],
 *       "sectors": ["IT", "소프트웨어"],
 *       "employment_types": ["정규직"]
 *     },
 *     "relatedJobsResult": [
 *       {
 *         "job_posting_id": 124,
 *         "title": "프론트엔드 개발자",
 *         "company_name": "OpenAI",
 *         "salary": "4,500 만원",
 *         "link": "https://example.com/job/124",
 *         "deadline": "2024-12-31",
 *         "sectors": "소프트웨어, 프론트엔드"
 *       },
 *       ...
 *     ]
 *   }
 * }
 * @example error response - 400
 * {
 *   "status": "error",
 *   "message": "유효하지 않은 공고 ID입니다.",
 *   "code": 400
 * }
 * @example error response - 404
 * {
 *   "status": "error",
 *   "message": "해당 공고를 찾을 수 없습니다.",
 *   "code": 404
 * }
 * @example error response - 500
 * {
 *   "status": "error",
 *   "message": "공고 상세 조회 실패",
 *   "code": 500,
 *   "error": "Error message"
 * }
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    // ID 값 유효성 검사
    if (!id || isNaN(Number(id))) {
        return error(res, '유효하지 않은 공고 ID입니다.', null, 400);
    }

    try {
        // 공고 상세 정보 조회
        const [job] = await executeQuery(
            `SELECT 
                j.job_posting_id, 
                j.title, 
                c.company_name, 
                j.salary, 
                j.link, 
                j.deadline, 
                GROUP_CONCAT(DISTINCT l.location_name) AS locations,
                GROUP_CONCAT(DISTINCT s.sector_name) AS sectors,
                GROUP_CONCAT(DISTINCT et.employment_type_name) AS employment_types
             FROM job_postings j
             JOIN companies c ON j.company_id = c.company_id
             LEFT JOIN job_posting_locations jl ON j.job_posting_id = jl.job_posting_id
             LEFT JOIN locations l ON jl.location_id = l.location_id
             LEFT JOIN job_posting_sectors js ON j.job_posting_id = js.job_posting_id
             LEFT JOIN sectors s ON js.sector_id = s.sector_id
             LEFT JOIN job_posting_employment_types je ON j.job_posting_id = je.job_posting_id
             LEFT JOIN employment_types et ON je.employment_type_id = et.employment_type_id
             WHERE j.job_posting_id = ?
             GROUP BY j.job_posting_id`,
            [id]
        );

        // 공고가 없을 경우
        if (!job || job.length === 0) {
            return error(res, '해당 공고를 찾을 수 없습니다.', null, 404);
        }

        // 조회수 증가
        await executeQuery('UPDATE job_postings SET views = views + 1 WHERE job_posting_id = ?', [id]);

        // 해당 공고와 동일 회사 또는 직무 분야를 가진 공고를 중복 제외 후 랜덤 정렬하여 최대 5개 추천합니다.
        const [relatedJobs] = await executeQuery(
            `SELECT 
            j.job_posting_id, 
            j.title, 
            c.company_name, 
            j.salary, 
            j.link, 
            j.deadline,
            (SELECT GROUP_CONCAT(DISTINCT s.sector_name SEPARATOR ', ')
            FROM job_posting_sectors js
            JOIN sectors s ON js.sector_id = s.sector_id
            WHERE js.job_posting_id = j.job_posting_id) AS sectors
            FROM job_postings j
            JOIN companies c ON j.company_id = c.company_id
            WHERE (j.company_id = ? OR j.job_posting_id IN (
            SELECT DISTINCT js2.job_posting_id
            FROM job_posting_sectors js2
            WHERE js2.sector_id IN (
            SELECT sector_id 
            FROM job_posting_sectors 
            WHERE job_posting_id = ?
            )
            ))
            AND j.job_posting_id != ?
            GROUP BY j.job_posting_id, j.title, c.company_name, j.salary, j.link, j.deadline
            ORDER BY RAND()
            LIMIT 5`,
            [job[0].company_name, id, id]
        );

        // 상세 정보 정보 고르기
        const detailJob = {
            job_posting_id: job[0].job_posting_id,
            title: job[0].title,
            company_name: job[0].company_name,
            salary: job[0].salary,
            link: job[0].link,
            deadline: job[0].deadline,
            locations: job[0].locations ? job.map(j => j.locations.split(', ')).flat() : [],
            sectors: job[0].sectors ? job.map(j => j.sectors.split(', ')).flat() : [],
            employment_types: job[0].employment_types ? job[0].employment_types.split(', ') : []
        };

        // 관련 공고가 없을 경우 "관련 추천 공고가 없습니다" 반환
        const relatedJobsResult = relatedJobs.length > 0
            ? relatedJobs.map(relatedJob => ({
                job_posting_id: relatedJob.job_posting_id,
                title: relatedJob.title,
                company_name: relatedJob.company_name,
                salary: relatedJob.salary,
                link: relatedJob.link,
                deadline: relatedJob.deadline,
                sectors: relatedJob.sectors
            }))
            : "관련 추천 공고가 없습니다";

        success(res, "공고 상세 조회 성공", {detailJob, relatedJobsResult} );
    } catch (err) {
        error(res, '공고 상세 조회 실패', err, 500);
    }
});


/**
 * @swagger
 * paths:
 *  /jobs/{id}:
 *    delete:
 *      summary: "채용 공고 삭제"
 *      description: "특정 공고 ID의 채용 공고를 삭제합니다. 공고 삭제는 소유권 검증을 거친 후 수행됩니다."
 *      tags: [Jobs]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: integer
 *          description: "삭제할 공고의 ID"
 *      responses:
 *        200:
 *          description: "공고 삭제 성공"
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
 *                    example: "공고가 성공적으로 삭제되었습니다."
 *                  data:
 *                    type: integer
 *                    example: 480
 *        400:
 *          description: "유효하지 않은 공고 ID"
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
 *                    example: "유효하지 않은 공고 ID입니다."
 *                  code:
 *                    type: integer
 *                    example: 400
 *        403:
 *          description: "삭제 권한 없음"
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
 *                    example: "이 공고를 삭제할 권한이 없습니다."
 *                  code:
 *                    type: integer
 *                    example: 403
 *        404:
 *          description: "공고 없음"
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
 *                    example: "삭제하려는 공고가 존재하지 않습니다."
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
 *                    example: "공고 삭제 실패"
 *                  code:
 *                    type: integer
 *                    example: 500
 *                  error:
 *                    type: string
 *                    example: "Error message"
 */

/**
 * @function
 * @name deleteJobPosting
 * @description 사용자가 소유한 특정 공고를 삭제합니다.
 * @route DELETE /jobs/:id
 * @param {Object} req - Express 요청 객체
 * @param {Object} req.params - 경로 매개변수
 * @param {number} req.params.id - 삭제할 공고의 ID
 * @param {Object} req.user - 인증된 사용자 정보
 * @param {number} req.user.userId - 요청한 사용자의 ID
 * @param {Object} res - Express 응답 객체
 * @returns {void} 반환 데이터는 JSON 형식으로 구성됩니다.
 */
 router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!id || isNaN(Number(id))) {
        return error(res, '유효하지 않은 공고 ID입니다.', null, 400);
    }

    try {
        // 공고 존재 여부 및 소유권 확인
        const [job] = await executeQuery(
            `SELECT job_posting_id, user_id FROM job_postings WHERE job_posting_id = ?`,
            [id]
        );

        if (job.length === 0) {
            return error(res, '삭제하려는 공고가 존재하지 않습니다.', null, 404);
        }

        // 소유권 확인
        if (job[0].user_id !== userId) {
            return error(res, '이 공고를 삭제할 권한이 없습니다.', null, 403);
        }

        // 공고 삭제
        await executeQuery(`DELETE FROM job_postings WHERE job_posting_id = ?`, [id]);

        success(res, '공고가 성공적으로 삭제되었습니다.', id);
    } catch (err) {
        error(res, '공고 삭제 실패', err, 500);
    }
});


module.exports = router;
