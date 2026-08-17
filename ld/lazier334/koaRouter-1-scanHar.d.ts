/** entry对象 */
export type ENTRYTEMP = {
    "filepath": "由上面的代码 har.log.entries.forEach(entry => entry.filepath = fp); 附加，有可能不存在这个属性",
    "_initiator": {
        "type": "other"
    },
    "_priority": "VeryHigh",
    "_resourceType": "document",
    "cache": {},
    "pageref": "page_1",
    "request": {
        "method": "GET",
        "url": "http://baidu.com/aaa/bbb",
        "httpVersion": "HTTP/1.1",
        "headers": [
            {
                "name": "Accept",
                "value": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
            },
            {
                "name": "Accept-Encoding",
                "value": "gzip, deflate, br, zstd"
            },
            {
                "name": "Accept-Language",
                "value": "zh-CN,zh;q=0.9"
            },
            {
                "name": "Cache-Control",
                "value": "no-cache"
            },
            {
                "name": "Connection",
                "value": "keep-alive"
            },
            {
                "name": "Host",
                "value": "baidu.com"
            },
            {
                "name": "Pragma",
                "value": "no-cache"
            },
            {
                "name": "Sec-Fetch-Dest",
                "value": "document"
            },
            {
                "name": "Sec-Fetch-Mode",
                "value": "navigate"
            },
            {
                "name": "Sec-Fetch-Site",
                "value": "none"
            },
            {
                "name": "Sec-Fetch-User",
                "value": "?1"
            },
            {
                "name": "Upgrade-Insecure-Requests",
                "value": "1"
            },
            {
                "name": "User-Agent",
                "value": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
            },
            {
                "name": "sec-ch-ua",
                "value": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Google Chrome\";v=\"138\""
            },
            {
                "name": "sec-ch-ua-mobile",
                "value": "?0"
            },
            {
                "name": "sec-ch-ua-platform",
                "value": "\"Windows\""
            }
        ],
        "queryString": [],
        "cookies": [],
        "headersSize": 1564,
        "bodySize": 0
    },
    "response": {
        "status": 302,
        "statusText": "Moved Temporarily",
        "httpVersion": "HTTP/1.1",
        "headers": [
            {
                "name": "Connection",
                "value": "keep-alive"
            },
            {
                "name": "Content-Length",
                "value": "161"
            },
            {
                "name": "Content-Type",
                "value": "text/html"
            },
            {
                "name": "Date",
                "value": "Thu, 31 Jul 2025 08:25:48 GMT"
            },
            {
                "name": "Location",
                "value": "https://www.baidu.com/"
            },
            {
                "name": "Server",
                "value": "bfe/1.0.8.18"
            }
        ],
        "cookies": [],
        "content": {
            "size": 0,
            "mimeType": "x-unknown",
            "compression": 197,
            "text": "text body 123456"
        },
        "redirectURL": "https://www.baidu.com/",
        "headersSize": 197,
        "bodySize": -197,
        "_transferSize": 0,
        "_error": null,
        "_fetchedViaServiceWorker": false
    },
    "serverIPAddress": "",
    "startedDateTime": "2025-07-31T08:25:48.486Z",
    "time": 10.079999919980764,
    "timings": {
        "blocked": 10.079999919980764,
        "dns": -1,
        "ssl": -1,
        "connect": -1,
        "send": 0,
        "wait": -1.3749999925494194,
        "receive": 0,
        "_blocked_queueing": 10.079999919980764
    }
}

/** har 文件的模板 */
export type HARTEMP = {
    "log": {
        "version": "1.2",
        "creator": {
            "name": "WebInspector",
            "version": "537.36"
        },
        "pages": [
            {
                "startedDateTime": "2025-07-31T08:25:48.496Z",
                "id": "page_1",
                "title": "http://baidu.com/",
                "pageTimings": {
                    "onContentLoad": 598.9290000870824,
                    "onLoad": 759.0350001119077
                }
            }
        ],
        "entries": ENTRYTEMP[]
    }
}

/** 可用于查询细节或者直接重写ctx.body */
export type SendEntryType = {
    /** entry对象 */
    entry: ENTRYTEMP;
    /** 要响应的entry数据 */
    entryResponse: string | Buffer<ArrayBuffer>;
}