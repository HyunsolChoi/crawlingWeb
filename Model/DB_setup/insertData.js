const mysql = require('mysql2/promise');
const moment = require('moment'); // 날짜 파싱을 위해 사용
const crypto = require('crypto'); // 해시 계산을 위해 사용
const crawlSaramin = require('./crawlData');
const { getConnection } = require('../../Utils/connectDB');


// DB 및 테이블이 생성 된 이후에 실행해야합니다.
async function insertData(dataArray) {
    try {
        const connection = await getConnection();
        console.log('데이터베이스에 연결되었습니다.');

        for (const data of dataArray) {
            let transactionActive = false; // 트랜잭션 상태 추적

            try {
                await connection.beginTransaction();
                transactionActive = true;

                // 회사 정보 삽입
                await connection.execute('INSERT IGNORE INTO companies (company_name) VALUES (?)', [data['회사명']]);
                const [companyRows] = await connection.execute('SELECT company_id FROM companies WHERE company_name = ?', [data['회사명']]);
                const companyId = companyRows[0]?.company_id;
                if (!companyId) throw new Error('company_id 조회 실패');

                // 학력 정보 삽입
                if (data['학력']) {
                    await connection.execute('INSERT IGNORE INTO educations (education_level) VALUES (?)', [data['학력']]);
                }
                const [educationRows] = await connection.execute('SELECT education_id FROM educations WHERE education_level = ?', [data['학력']]);
                const educationId = educationRows[0]?.education_id || null;

                // 직무분야와 수정일 파싱
                const { sectorsArray, lastModifiedDate } = parseSectorsAndModifiedDate(data['직무분야']);

                // 링크 해시 계산
                const linkHash = crypto.createHash('sha256').update(data['링크']).digest('hex');

                // 채용 정보 삽입
                const [insertResult] = await connection.execute(
                    `INSERT IGNORE INTO job_postings (company_id, title, link, link_hash, education_id, deadline, last_modified_date, salary)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [companyId, data['제목'], data['링크'], linkHash, educationId, data['마감일'], lastModifiedDate, data['급여']]
                );

                // INSERT 결과 확인
                if (insertResult.affectedRows === 0) {
                    console.log(`DEBUG: 삽입 실패 - 중복된 link_hash 또는 다른 제약 조건 위반`);
                }

                // job_posting_id 조회
                const [jobPostingRows] = await connection.execute('SELECT job_posting_id FROM job_postings WHERE link_hash = ?', [linkHash]);
                const jobPostingId = jobPostingRows[0]?.job_posting_id;
                if (!jobPostingId) {
                    throw new Error(`job_posting_id 조회 실패: ${data['제목']}`);
                }


                // 경력 정보 삽입 및 관계 설정
                const experiencesArray = parseMultiValueField(data['경력']);
                for (const exp of experiencesArray) {
                    await connection.execute('INSERT IGNORE INTO experiences (experience_level) VALUES (?)', [exp]);
                    const [experienceRows] = await connection.execute('SELECT experience_id FROM experiences WHERE experience_level = ?', [exp]);
                    const experienceId = experienceRows[0]?.experience_id;
                    if (experienceId) {
                        await connection.execute('INSERT IGNORE INTO job_posting_experiences (job_posting_id, experience_id) VALUES (?, ?)', [jobPostingId, experienceId]);
                    }
                }

                // 지역 정보 삽입 및 관계 설정
                const locationsArray = parseMultiValueField(data['지역']);
                for (const loc of locationsArray) {
                    await connection.execute('INSERT IGNORE INTO locations (location_name) VALUES (?)', [loc]);
                    const [locationRows] = await connection.execute('SELECT location_id FROM locations WHERE location_name = ?', [loc]);
                    const locationId = locationRows[0]?.location_id;
                    if (locationId) {
                        await connection.execute('INSERT IGNORE INTO job_posting_locations (job_posting_id, location_id) VALUES (?, ?)', [jobPostingId, locationId]);
                    }
                }

                // 고용 형태 정보 삽입 및 관계 설정
                if (data['고용형태']) {
                    await connection.execute('INSERT IGNORE INTO employment_types (employment_type_name) VALUES (?)', [data['고용형태']]);
                    const [employmentTypeRows] = await connection.execute('SELECT employment_type_id FROM employment_types WHERE employment_type_name = ?', [data['고용형태']]);
                    const employmentTypeId = employmentTypeRows[0]?.employment_type_id;
                    if (employmentTypeId) {
                        await connection.execute(
                            'UPDATE job_postings SET employment_type_id = ? WHERE job_posting_id = ?',
                            [employmentTypeId, jobPostingId]
                        );
                        await connection.execute('INSERT IGNORE INTO job_posting_employment_types (job_posting_id, employment_type_id) VALUES (?, ?)', [jobPostingId, employmentTypeId]);
                    }
                }

                // 직무 분야 정보 삽입 및 관계 설정
                for (const sectorName of sectorsArray) {
                    await connection.execute('INSERT IGNORE INTO sectors (sector_name) VALUES (?)', [sectorName]);
                    const [sectorRows] = await connection.execute('SELECT sector_id FROM sectors WHERE sector_name = ?', [sectorName]);
                    const sectorId = sectorRows[0]?.sector_id;
                    if (sectorId) {
                        await connection.execute('INSERT IGNORE INTO job_posting_sectors (job_posting_id, sector_id) VALUES (?, ?)', [jobPostingId, sectorId]);
                    }
                }

                await connection.commit();
                transactionActive = false;
                console.log(`데이터 삽입 완료: ${data['제목']}`);
            } catch (error) {
                if (transactionActive) {
                    await connection.rollback();
                }
                console.error(`데이터 삽입 중 오류 발생 (${data['제목']}):`, error.message);
            }
        }

        // 고용형태 정보가 없는 공고에 대해서
        // 정보없음 이라는 고용형태를 할당함
        await connection.query(`
            UPDATE job_postings
            SET employment_type_id = (
                SELECT employment_type_id 
                FROM employment_types 
                WHERE employment_type_name = '정보없음'
            )
            WHERE employment_type_id IS NULL;
        `);

        await connection.end();
        console.log('데이터베이스 연결이 종료되었습니다.');
    } catch (error) {
        console.error('데이터베이스 연결 중 오류:', error.message);
    }
}

// 보조 함수들

function parseMultiValueField(fieldValue) {
    // 쉼표, 점, 중간 점 등으로 구분하여 배열로 반환
    return fieldValue.split(/[,·]/).map(value => value.trim()).filter(value => value !== '');
}

function parseSectorsAndModifiedDate(sectorStr) {
    // '수정일' 또는 '등록일' 분리
    let modifiedDateMatch = sectorStr.match(/(수정일|등록일)\s*(\d{2})\/(\d{2})\/(\d{2})/);
    let lastModifiedDate = null;
    if (modifiedDateMatch) {
        let year = parseInt(modifiedDateMatch[2], 10) + 2000;
        let month = parseInt(modifiedDateMatch[3], 10);
        let day = parseInt(modifiedDateMatch[4], 10);
        lastModifiedDate = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD').format('YYYY-MM-DD');
        sectorStr = sectorStr.replace(modifiedDateMatch[0], '');
    }

    let sectorsArray = sectorStr.split(/[,]/).map(value => value.trim()).filter(value => value !== '' && value !== '외');

    return { sectorsArray, lastModifiedDate };
}

// 지정한 page 만큼 크롤링합니다. 최대 250
// 각 페이지 당 0.6초 딜레이가 생깁니다.
// 크롤링 과정 및 page 에 따라 시간이 소요될 수 있습니다.
// 읽어오는 공고의 수는 page * 40,
async function main() {
    const dataArray = await crawlSaramin(250);
    await insertData(dataArray);
}

main().catch(console.error);
