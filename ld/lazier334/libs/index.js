export * from '../../plugins/libs/baseImport.js'
import * as utils from '../utils/utils.js'
import * as types from '../types/index.js'

export {
    utils,
    types,
    warpKoaCtxAll,
    warpKoaCtxByWeb,
    warpKoaCtxByHar,
}

/** ctx 的其他附加提示信息 */
const CtxOtherType = {
    /** 设置为 true 可以关闭自动补全 */
    notCompleteFile: false
}

/**
 * 引入提示信息
 * @typedef {import('../koaRouter-1.1-scanWeb').SendFileType} SendFileType
 * @typedef {import('../koaRouter-1-scanHar').SendEntryType} SendEntryType
 * @typedef {SendFileType & SendEntryType} extendTypes
 */

/**
 * 给 ctx 增加流转 scanWeb 与 scanHar 后的提示信息
 * @template T
 * @param {T} ctx 
 * @returns {T & extendTypes & CtxOtherType}
 */
function warpKoaCtxAll(ctx) {
    return ctx;
}

/**
 * 给 ctx 增加流转 scanWeb 后的提示信息
 * @template T
 * @param {T} ctx 
 * @returns {T & SendFileType & CtxOtherType}
 */
function warpKoaCtxByWeb(ctx) {
    return ctx;
}

/**
 * 给 ctx 增加流转 scanHar 后的提示信息
 * @template T
 * @param {T} ctx 
 * @returns {T & SendEntryType & CtxOtherType}
 */
function warpKoaCtxByHar(ctx) {
    return ctx;
}