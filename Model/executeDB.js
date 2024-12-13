const { getConnection } = require('../Utils/connectDB');

/**
 * @function
 * @name executeQuery
 * SQL 쿼리를 실행하고 결과를 반환하는 함수
 * @param {string} query - 실행할 SQL 쿼리
 * @param {Array} params - SQL 쿼리에 전달할 파라미터 배열
 * @returns {Promise<any>} 실행 결과 반환
 */
exports.executeQuery = async (query, params) => {

    const connection = await getConnection();
    try {
        return await connection.query(query, params);
    } catch (error) {
        console.error('데이터 베이스 질의 실행 오류 발생:', error.message);
        throw error; // 호출자에게 예외를 전달
    } finally {
        if(connection)
            await connection.end();
    }
};

/**
 * @function
 * @name executeTransaction
 * @description 여러 개의 SQL 쿼리를 하나의 트랜잭션으로 실행합니다.
 * @async
 * @param {Array<Object>} queries - 실행할 쿼리 목록
 * @param {string} queries[].query - 실행할 SQL 쿼리 문자열
 * @param {Array<any>} [queries[].params] - 쿼리와 함께 사용할 매개변수 배열
 * @returns {Promise<Array<any>>} 실행 결과 배열
 *
 * @throws {Error} 트랜잭션 도중 오류가 발생하면 롤백 후 예외를 던집니다.
 */
exports.executeTransaction = async (queries) => {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const results = [];
        for (const { query, params } of queries) {
            const [result] = await connection.query(query, params);
            results.push(result);
        }

        await connection.commit();
        return results;
    } catch (error) {
        await connection.rollback();
        console.error('트랜잭션 실패:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};
