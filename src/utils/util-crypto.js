const crypto = require('crypto');
const Config = require('./config.js');

/** 加解密对象 */
class SymmetricEncryptor {
    constructor(algorithm = 'aes-256-cbc') {
        this.algorithm = algorithm;
    }

    encrypt(text, secretKey) {
        try {
            // 生成随机初始化向量
            const iv = crypto.randomBytes(16);

            // 创建加密器
            const cipher = crypto.createCipheriv(
                this.algorithm,
                this._validateKey(secretKey),
                iv
            );

            // 加密数据并输出Base64
            let encrypted = cipher.update(text, 'utf8', 'base64');
            encrypted += cipher.final('base64');

            // 返回IV和加密数据的组合(Base64格式)
            return Buffer.concat([iv, Buffer.from(encrypted, 'base64')]).toString('base64');
        } catch (error) {
            throw new Error(`加密失败: ${error.message}`);
        }
    }

    decrypt(encryptedData, secretKey) {
        try {
            // 从Base64解码整个数据
            const buffer = Buffer.from(encryptedData, 'base64');

            // 提取IV(前16字节)和加密数据
            const iv = buffer.slice(0, 16);
            const encrypted = buffer.slice(16).toString('base64');

            // 创建解密器
            const decipher = crypto.createDecipheriv(
                this.algorithm,
                this._validateKey(secretKey),
                iv
            );

            // 解密数据
            let decrypted = decipher.update(encrypted, 'base64', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            throw new Error(`解密失败: ${error.message}`);
        }
    }

    _validateKey(key) {
        if (!key) throw new Error('加密密钥不能为空');
        if (typeof key !== 'string') throw new Error('密钥必须是字符串');

        // 对于AES-256，我们需要32字节的密钥
        if (this.algorithm === 'aes-256-cbc') {
            // 如果密钥不是32字节，使用SHA-256哈希生成32字节密钥
            if (Buffer.from(key).length !== 32) {
                return crypto.createHash('sha256').update(key).digest();
            }
        }

        return Buffer.from(key);
    }
}

const encryptor = new SymmetricEncryptor();
module.exports = {
    encryptor,
    /**
     * 解密
     * 如果没有开启加解密功能就先尝试解密，解不出来就返回原始数据
     * @param {string} data 
     * @param {string} key 
     */
    decodeText(data, key) {
        try {
            try {
                // 尝试直接明文解码
                JSON.parse(data);
                return data;
            } catch (err) {
                // 使用秘钥解码
                return encryptor.decrypt(data, key);
            }
        } catch (error) {
            if (Config.cryptoDataEnable) throw error;
        }
        return data;
    },
    /**
     * 加密
     * @param {string} data 
     * @param {string} key 
     */
    encodeText(data, key) {
        if (Config.cryptoDataEnable) {
            return encryptor.encrypt(data, key)
        }
        return data;
    }
}