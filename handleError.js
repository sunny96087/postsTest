const headers = require('./headers');

const handleError = (res, message) => {
    res.writeHead(400,headers);

    res.write(JSON.stringify({
        "status": "false",
        "message": message || "錯誤 請聯繫管理員"
    }));
    res.end();
}

module.exports = handleError;