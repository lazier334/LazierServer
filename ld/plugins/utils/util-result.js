export default result;
export { result };

/**
 * 响应数据
 * @param {any} data 
 * @param {string} msg 
 * @param {number} code 
 * @returns 
 */
function result(data, msg = '成功', status = true, code = 200) {
    return { code, msg, status, data }
}