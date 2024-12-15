const { getConnection } = require('../../Utils/connectDB.js');
require('mysql2/promise');

// 데이터베이스 연결 설정 및 테이블 생성 함수, 최초 실행 시에만 필요
async function createTables() {
    try {

        // 데이터베이스 연결
        const connection = await getConnection();
        console.log('데이터베이스에 연결되었습니다.');

        // 테이블 생성 SQL 문 배열 (참조 순서를 고려하여 조정)
        const sqlStatements = [
            // 1. 회사 테이블
            `CREATE TABLE IF NOT EXISTS companies (
                company_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                company_name VARCHAR(255) NOT NULL UNIQUE
            );`,

            // 2. 학력 테이블
            `CREATE TABLE IF NOT EXISTS educations (
                education_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                education_level VARCHAR(255) NOT NULL UNIQUE
            );`,

            // 3. 고용 형태 테이블 수정
            `CREATE TABLE IF NOT EXISTS employment_types (
                employment_type_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                employment_type_name VARCHAR(255) NOT NULL UNIQUE DEFAULT '정보없음'
            );`,

            // 4. 직무 분야 테이블
            `CREATE TABLE IF NOT EXISTS sectors (
                sector_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                sector_name VARCHAR(255) NOT NULL UNIQUE
            );`,

            // 5. 지역 테이블
            `CREATE TABLE IF NOT EXISTS locations (
                location_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                location_name VARCHAR(255) NOT NULL UNIQUE
            );`,

            // 6. 경력 테이블
            `CREATE TABLE IF NOT EXISTS experiences (
                experience_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                experience_level VARCHAR(255) NOT NULL UNIQUE
            );`,

            // 7. 사용자 정보 테이블
            `CREATE TABLE IF NOT EXISTS users (
                user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL
            );`,

            // 8. 채용 정보 테이블
            `CREATE TABLE IF NOT EXISTS job_postings (
                job_posting_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                company_id BIGINT NOT NULL,
                user_id BIGINT NOT NULL DEFAULT 1,
                title TEXT NOT NULL,
                link TEXT NOT NULL,
                link_hash CHAR(64) NOT NULL UNIQUE,
                education_id BIGINT,
                deadline VARCHAR(20),
                views INT DEFAULT 0,
                employment_type_id BIGINT,
                salary VARCHAR(64) DEFAULT '추후 협의',
                last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES companies(company_id),
                FOREIGN KEY (education_id) REFERENCES educations(education_id),
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (employment_type_id) REFERENCES employment_types(employment_type_id)
            );`,

            // 9. 채용-경력 매핑 테이블
            `CREATE TABLE IF NOT EXISTS job_posting_experiences (
                job_posting_id BIGINT,
                experience_id BIGINT,
                PRIMARY KEY (job_posting_id, experience_id),
                FOREIGN KEY (job_posting_id) REFERENCES job_postings(job_posting_id) ON DELETE CASCADE,
                FOREIGN KEY (experience_id) REFERENCES experiences(experience_id) ON DELETE CASCADE
            );`,

            // 10. 채용-지역 매핑 테이블
            `CREATE TABLE IF NOT EXISTS job_posting_locations (
                job_posting_id BIGINT,
                location_id BIGINT,
                PRIMARY KEY (job_posting_id, location_id),
                FOREIGN KEY (job_posting_id) REFERENCES job_postings(job_posting_id) ON DELETE CASCADE,
                FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE
            );`,

            // 11. 채용-고용 형태 매핑 테이블
            `CREATE TABLE IF NOT EXISTS job_posting_employment_types (
                job_posting_id BIGINT,
                employment_type_id BIGINT,
                PRIMARY KEY (job_posting_id, employment_type_id),
                FOREIGN KEY (job_posting_id) REFERENCES job_postings(job_posting_id) ON DELETE CASCADE,
                FOREIGN KEY (employment_type_id) REFERENCES employment_types(employment_type_id) ON DELETE CASCADE
            );`,

            // 12. 채용-직무 분야 매핑 테이블
            `CREATE TABLE IF NOT EXISTS job_posting_sectors (
                job_posting_id BIGINT,
                sector_id BIGINT,
                PRIMARY KEY (job_posting_id, sector_id),
                FOREIGN KEY (job_posting_id) REFERENCES job_postings(job_posting_id) ON DELETE CASCADE,
                FOREIGN KEY (sector_id) REFERENCES sectors(sector_id) ON DELETE CASCADE
            );`,

            // 13. 리프레시 토큰 테이블
            `CREATE TABLE IF NOT EXISTS refresh_tokens (
                token_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                refresh_token VARCHAR(512) NOT NULL UNIQUE,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );`,

            // 14. 로그인 이력 테이블
            `CREATE TABLE IF NOT EXISTS login_history (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                login_time DATETIME NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );`,

            // 15. 지원 정보 테이블
            `CREATE TABLE IF NOT EXISTS applications (
                application_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                job_posting_id BIGINT NOT NULL,
                status ENUM('지원 중', '취소됨', '채용 완료', '탈락') NOT NULL DEFAULT '지원 중',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (job_posting_id) REFERENCES job_postings(job_posting_id) ON DELETE CASCADE
            );`,

            // 16. 북마크 정보 저장 테이블
            `CREATE TABLE IF NOT EXISTS bookmarks (
                user_id BIGINT NOT NULL,
                job_posting_id BIGINT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, job_posting_id),
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (job_posting_id) REFERENCES job_postings(job_posting_id) ON DELETE CASCADE
            );`
        ];

        let cntErr = 0;
        // 각 SQL 문 실행
        for (let i = 0; i < sqlStatements.length; i++) {
            try {
                await connection.execute(sqlStatements[i]);
                console.log(`테이블 ${i + 1}/${sqlStatements.length}이(가) 생성되었습니다.`);
            } catch (error) {
                console.error(`테이블 생성 중 오류: ${error.message}`);
                cntErr ++;
            }
        }

        try{
            if(cntErr === 0) {
                await connection.query(`INSERT INTO users (email, password, name) VALUES ('admin@example.com', 'MTIzNDU=', 'Admin');`)
                console.error("관리자 계정 생성 완료");
            }
        } catch (error) {
            console.error('관리자 계정 생성 중 오류:', error.message);
        }

        if (connection) {
            await connection.end();
            console.log('데이터베이스 연결이 종료되었습니다.');
        }
    } catch (error) {
        console.error('데이터베이스 연결 중 오류:', error.message);
    }
}

// 테이블 생성 함수 실행
createTables();