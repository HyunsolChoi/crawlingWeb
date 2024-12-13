const swaggerUi = require("swagger-ui-express");
const swaggereJsdoc = require("swagger-jsdoc");

const options = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            version: "1.0.0",
            title: "과제 3 - Swagger UI",
            description:
                "* 웹 서비스 설계-과제 3 API UI : 사람인 취업공고 크롤링 및 REST API 설계 \n\n " +
                "* /auth/register, /auth/login, /api-docs 세 경로를 제외한 모든 경로에서는 인증이 필요합니다.\n" +
                "* 인증이 없는 경우 401, 토큰이 유효하지않는 경우 403 반환 하단을 참고하여 사용해주세요.\n\n" +
                "1. 회원이 아니시라면 회원 가입 후 /auth/login 에서 로그인 후 발행되는 accessToken 을 복사합니다.\n" +
                "2. 복사한 accessToken 을 Authorize 를 눌러 value 에 붙여넣기 후 Authorize 이후 모든 경로에 접근 가능합니다."

        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        servers: [
            {
                url: "https://113.198.66.75:17109/", // 요청 URL
            },
        ],
    },
    apis: ["./Control/*.js"], //Swagger 파일 연동
};

const specs = swaggereJsdoc(options);

module.exports = { swaggerUi, specs };