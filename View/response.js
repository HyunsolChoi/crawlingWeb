
// data, pagination 는 있을 때만 추가
module.exports.success = (res, message = '요청 성공', data = null, pagination = null, is201 = false) => {
    const response = { status: 'success', message };

    if (!Array.isArray(data) && !(typeof data === 'object')) {
        // 원시 값(문자열, 숫자 등)인 경우 객체로 래핑
        response.data = { value: data };
    }
    else if(data){
        response.data = data;
    }

    if (pagination) {
        response.pagination = pagination;
    }

    // 201, 200 성공 status 구분
    if(is201){
        res.status(201).json(response);
    }else{
        res.status(200).json(response);
    }
};

// err 는 있을 때만 추가
module.exports.error = (res, message = '요청 실패', err = null, code = 500) => {
    const response = { status: 'error', message, code };

    if (err && err.message) {
        response.error = err.message;
    }

    res.status(code).json(response);
};
