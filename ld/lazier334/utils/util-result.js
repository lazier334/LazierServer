export default result;
export { result };

/**
 * 响应数据
 * @param {any} data 
 * @param {string} msg 
 * @param {number} code 
 * @returns 
 */
function result(data, msg = '成功', code = 200, status) {
    if (status == undefined) status = code == 200;
    if (data instanceof Error) data = {
        message: data.message,
        name: data.name,
        stack: data.stack,
        cause: data.cause
    };
    return { code, msg, status, data }
}