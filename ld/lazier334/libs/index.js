export * from '../../plugins/libs/baseImport.js'
import utils from '../utils/utils.js'
import * as types from '../types/index.js'

export {
    utils,
    types,
    warpKoaCtxAll,
    warpKoaCtxByWeb,
    warpKoaCtxByHar,
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
 * @returns {T & extendTypes}
 */
function warpKoaCtxAll(ctx) {
    return ctx;
}

/**
 * 给 ctx 增加流转 scanWeb 后的提示信息
 * @template T
 * @param {T} ctx 
 * @returns {T & SendFileType}
 */
function warpKoaCtxByWeb(ctx) {
    return ctx;
}

/**
 * 给 ctx 增加流转 scanHar 后的提示信息
 * @template T
 * @param {T} ctx 
 * @returns {T & SendEntryType}
 */
function warpKoaCtxByHar(ctx) {
    return ctx;
}