const axios = require('axios');
const cheerio = require('cheerio');

/**
 * 사람인 채용정보 크롤링 함수
 * @param {number} pages 크롤링할 페이지 수
 * @returns {Promise<Array>} 채용 정보 배열
 */
async function crawlSaramin(pages = 1) {
    const jobs = [];
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    for (let page = 1; page <= pages; page++) {
        const url = `https://www.saramin.co.kr/zf_user/search/recruit?searchType=search&searchword=채용&recruitPage=${page}&recruitSort=relation&recruitPageCount=40`;

        try {
            const response = await axios.get(url, { headers });
            const $ = cheerio.load(response.data);

            // 채용공고 목록 가져오기
            $('.item_recruit').each((_, element) => {
                try {
                    const company = $(element).find('.corp_name a').text().trim();
                    const title = $(element).find('.job_tit a').text().trim();
                    const link = 'https://www.saramin.co.kr' + $(element).find('.job_tit a').attr('href');

                    const conditions = $(element).find('.job_condition span');

                    // 연속 된 하나로 셋팅
                    const location = conditions.eq(0).text().trim().replace(/\s+/g, ' ') || '';
                    const experience = conditions.eq(1).text().trim() || '';
                    const education = conditions.eq(2).text().trim() || '';
                    const employmentType = conditions.eq(3).text().trim() || '';
                    const salary = conditions.eq(4).text().trim() || '추후 협의';

                    const deadline = $(element).find('.job_date .date').text().trim() || '';
                    let sector = $(element).find('.job_sector').text().trim() || '';

                    // sector 처리: " 외" 제거 및 중복 제거
                    if (sector) {
                        // " 외" 제거 및 고유 값 유지
                        const uniqueSectors = Array.from(
                            new Set(
                                sector
                                    .split(',')
                                    .map(s => s.replace(' 외', '').trim()) // " 외" 제거
                            )
                        );
                        sector = uniqueSectors.join(', '); // 고유 값 합치기
                    }

                    jobs.push({
                        회사명: company,
                        제목: title,
                        링크: link,
                        지역: location,
                        경력: experience,
                        학력: education,
                        고용형태: employmentType,
                        급여: salary,
                        마감일: deadline,
                        직무분야: sector
                    });
                } catch (error) {
                    console.error('항목 파싱 중 에러:', error.message);
                }
            });

            console.log(`${page}페이지 크롤링 완료`);
            await new Promise(resolve => setTimeout(resolve, 600)); // 0.6초 딜레이

            if (jobs.length >= 10000) break; // 최소 10,100개 이상의 데이터가 수집되면 종료
        } catch (error) {
            console.error('페이지 요청 중 에러:', error.message);
        }
    }

    return jobs;
}

module.exports = crawlSaramin;


// 실행 예제
/*(async () => {
    try {
        const jobList = await crawlSaramin(2);
        console.log(jobList);
        console.log(`총 ${jobList.length}개의 채용 정보를 크롤링했습니다.`);
    } catch (error) {
        console.error('크롤링 중 에러:', error.message);
    }
})();*/
