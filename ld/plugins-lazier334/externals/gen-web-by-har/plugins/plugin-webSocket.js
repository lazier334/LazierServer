const pluginType = require("./plugin-type.js");
const wsEntry = getWSEntry();
const lc = {
    open: true
}

/** 插件-解析webSocket */
module.exports = pluginType(async function (entry, config, next) {
    if (lc.open && entry._resourceType == wsEntry._resourceType && Array.isArray(entry._webSocketMessages)) {
        const asc = config.getStorage("plugin-autoSave.js");
        asc.fileData.text = anyWebSocket(entry);
    }
    return next();
})

/**
 * 解析 WebSocket 
 * @param {wsEntry} entry 
 */
function anyWebSocket(entry) {

    let msgs = entry._webSocketMessages.map(msg => {
        msg.time = parseFloat(msg.time).toFixed(3) * 1000;
        return msg
    });
    let lastTime = msgs[0].time;

    msgs.forEach(msg => {
        msg.step = msg.time - lastTime;
        if (100000 < msg.step) {
            console.log('消息间隔过长，请注意是否计算异常', msg.time, lastTime, msg)
        }
        lastTime = msg.time;
    });

    return JSON.stringify(msgs, null, 2)
}

/** 获取 websocket 的entry对象 */
function getWSEntry() {
    return ({
        "log": {
            "version": "1.2",
            "creator": {
                "name": "WebInspector",
                "version": "537.36"
            },
            "pages": [
                {
                    "startedDateTime": "2025-02-25T08:01:54.597Z",
                    "id": "page_5",
                    "title": "https://aviator-demo.spribegaming.com/?currency=USD&operator=demo&jurisdiction=CW&lang=EN&return_url=https:%2F%2Fspribe.co%2Fgames&user=17420&token=mYQlF6EhVZMVFW7F4jzgLvqPMLBimpkj",
                    "pageTimings": {
                        "onContentLoad": 5902.717000004486,
                        "onLoad": 7434.001999994507
                    }
                }
            ],
            "entries": [
                {
                    "_initiator": {
                        "type": "script",
                        "stack": {}
                    },
                    "_priority": null,
                    "_resourceType": "websocket",
                    "_webSocketMessages": [
                        {
                            "type": "send",
                            "time": 1740470523.307357,
                            "opcode": 2,
                            "data": "gAAzEgADAAFjAgAAAWEDAAAAAXASAAIAA2FwaQgABjEuNy4xOQACY2wIAApKYXZhU2NyaXB0"
                        },
                        {
                            "type": "receive",
                            "time": 1740470523.628165,
                            "opcode": 2,
                            "data": "gABNEgADAAFwEgADAAJjdAQAAAQAAAJtcwQAB6EgAAJ0awgAIDAyYTc2Y2NlZDIyZTBjODFmYWE2YmU5MTViMGY3ZmEwAAFhAwAAAAFjAgA="
                        },
                        {
                            "type": "send",
                            "time": 1740470523.631515,
                            "opcode": 2,
                            "data": "gALkEgADAAFjAgAAAWEDAAEAAXASAAQAAnpuCAAMYXZpYXRvcl9jb3JlAAJ1bggACzE3NDIwJiZkZW1vAAJwdwgAAAABcBIACAAFdG9rZW4IACBtWVFsRjZFaFZaTVZGVzdGNGp6Z0x2cVBNTEJpbXBragAIY3VycmVuY3kIAANVU0QABGxhbmcIAAJlbgAMc2Vzc2lvblRva2VuCABARk1HVm90STF4SUx4RHhMWVJLcnRKT1hHb2tMRjNoeGxVYWR3aWl3THp3WE95ZzR5M0ZLcjFZWlFRd3Z4M1UwZgAIcGxhdGZvcm0SAAMACmRldmljZUluZm8IAR17InVzZXJBZ2VudCI6Ik1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMzMuMC4wLjAgU2FmYXJpLzUzNy4zNiIsIm9zIjoiV2luZG93cyIsImJyb3dzZXIiOiJDaHJvbWUiLCJkZXZpY2UiOiJVbmtub3duIiwib3NfdmVyc2lvbiI6IndpbmRvd3MtMTAiLCJicm93c2VyX3ZlcnNpb24iOiIxMzMuMC4wLjAiLCJkZXZpY2VUeXBlIjoiZGVza3RvcCIsIm9yaWVudGF0aW9uIjoibGFuZHNjYXBlIn0ACXVzZXJBZ2VudAgAcSJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTMzLjAuMC4wIFNhZmFyaS81MzcuMzYiAApkZXZpY2VUeXBlCAAHZGVza3RvcAAHdmVyc2lvbggABjQuMi42MQAManVyaXNkaWN0aW9uCAACQ1cAEGFkZGl0aW9uYWxQYXJhbXMSAAA="
                        },
                        {
                            "type": "receive",
                            "time": 1740470524.664206,
                            "opcode": 2,
                            "data": "gACFEgADAAFwEgAGAAJycwMAAAACem4IAAxhdmlhdG9yX2NvcmUAAnVuCAALMTc0MjAmJmRlbW8AAnBpAwAAAAJybBEAAREACQQAAAABCAAKZ2FtZV9zdGF0ZQgAB2RlZmF1bHQBAAEAAQADAAADABQRAAAAAmlkBAMBVgQAAWEDAAEAAWMCAA=="
                        },
                        {
                            "type": "receive",
                            "time": 1740470524.665569,
                            "opcode": 2,
                            "data": "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"
                        },
                        {
                            "type": "send",
                            "time": 1740470524.814862,
                            "opcode": 2,
                            "data": "gAA+EgADAAFjAgEAAWEDAA0AAXASAAMAAWMIABZjdXJyZW50QmV0c0luZm9IYW5kbGVyAAFyBP////8AAXASAAA="
                        },
                        {
                            "type": "receive",
                            "time": 1740470524.857558,
                            "opcode": 2,
                            "data": "gABkEgADAAFwEgACAAFwEgAEAApuZXdTdGF0ZUlkBAAAAAEABGNvZGUEAAAAyAAHcm91bmRJZAQAa/S9AAh0aW1lTGVmdAQAABOIAAFjCAALY2hhbmdlU3RhdGUAAWEDAA0AAWMCAQ=="
                        },
                        {
                            "type": "receive",
                            "time": 1740470524.859836,
                            "opcode": 2,
                            "data": "gABVEgADAAFwEgACAAFwEgADAAliZXRzQ291bnQEAAAAAAAEY29kZQQAAADIAARiZXRzEQAAAAFjCAARdXBkYXRlQ3VycmVudEJldHMAAWEDAA0AAWMCAQ=="
                        },
                        {
                            "type": "receive",
                            "time": 1740470525.138233,
                            "opcode": 2,
                            "data": "oALQeJy9mMtuUzEQhuckQT1JQah9iO5Atsce2zsECCkrFogFqyokpyVSc1EuSH1DHgufhBXYcY7tkEV0ctHo08w/M799C32o1rfQO7wPYPi92W0/rPbL3QCgqmEwXc0a9wi/oJ5Otj8+73fbG/dx0P7vBsQtXEHfPV+9+wbH13D9NHluNvfzWQ0jbZS6u5s1ixW8cP8az9pQFQzn20+bpnnf7CpwcfebTbOcPtfQ//rlI7xcb1YP86dmvJg8NjUMJz/fKHq7Xj5Cvd82m+Vk4b4dtTHvObdWpSD0/ifCNVrktkAatPAzuPAUqUSAoXsechgkQ8Yy81A7BhsohdSSIgjGIegCCMaPILW2JgmhWyUyETRZZQoIEkNNIRXpJIbugsxi0Cx7OLSl0H4EJdDKCAJHbamAINXfCMMDAiGLdaWfoHsS0glQcZWbg1YKgvnrgFIgS2LoLsccBi5RlZjRXIZGg8KYHklaiwX0iH4EIwWLrUs/QndBZiBw7atEsSxIipsGP0KxLJyDgFIW2df/TIY/E5phdFP5EQoMp/MRpFS2hHvjAQZlhORJDAmTIYPBkqGLbKojgkbSMfemBDFeAIEHZrRlItYTfoTugsxA4EhUYjiFbDSaqHHyI3TPQg6CYkZecEQzgzHfYpzVzt2VbVdS4EyFzIhYV/oZuk+GHAaSGkUJ/xaw8lpQtCn8DAn+LYPBnYGxxL4MIKCxGFtWfoTujZmBoIWwuVk45aQtRxE9Y0tpLnnxJBBttDO9DOVuns5h4GRUiVrw0LpiiqKnGi9DgnfJYDBGYK4e2rYIDEkyQtskhO6dmYGgjTC5l1+HSgQUaTXXsZ3pZ0hQQwYDWZXtZE9NKI5SxRTpZyh333AGw0iTznVQLYIMlMIQF0kI3bOQgXDtDphUoisw0JlKKZvGkHAZeooBqmkNr49Bdi7kdrx8WEE16cMr91Ov+g13nH81"
                        },
                        {
                            "type": "receive",
                            "time": 1740470525.289346,
                            "opcode": 2,
                            "data": "oAL9eJy9mM1uEzEQxydNUTcpSLQPUXEBrT1jj31AQhQh9QwVAiFVabJUldok5KNSn4IzXDnxDty48AY8CXe84UBB6zhru+QQRdnE+uk/X//xPnShM92HrdV7F3qn1WJ+OFmOF9sA8BW2h5NRVX/8Dtv1oz2Q+7ADXfd558mb+59/9B+/h970YnBdzU7ORwXskjQaDw5G1eUE7rifHY3qv3egdz5/Pquqp9WiA1AMl7NZNR5eF9A9fvEM7k5nk3fnF9XR5eCsKqAYXD1Uj6bjMyiW82o2Hly6L/v1kSeIJOIQtv4ngi1LQxlUkM0ISjJhFEJ7FTZDeA2/XzcR+myUShShV8dBNyMIYa2KQWgnQiLCLloUNoMM7ImEO17LKIb2OqQwUIllmaEmrCcUxKQDCMYhcAYE04xAzNZEIbQvywQE1laZDAmJvqIgpTmKoX1CJjFwmdwc6lCwr0OipQCCQLb6NqZlb4WgsQxVZTNBhmG5MQEqoVI1qFNBlp55TRLLKIb26ZjCIAhVjh4tyNcaFIbyUZO1OdwbNiMYkmVwXBJlGRMe9yZKDDbIZoRsBnITBCJlc5gG4WFQRpKIYohIyAQGgVqn6rDONKAJjolmhPbZkIDg7BXmqAnPsERjMZSQzQjtVUhAYCltqgrrmrQVKIP2jcjc5k4jEW2oJpoZ8i01GzEYiak6rNkutZFsoxCyLbibILCRJnWfWHVITyQsCw7Zp2aGiC6dwODMvL5NCyeQVMg+NTPks3AbMPRZc+qtT41AnlAYLWQUQnsVEhDcol/qHFWBvqsnpWwcQ8R+mcBglBI5GJTHTTs7HzT07LI2x42HB0GY0oTMC6FO3mvWuGl3uL7Rp1/1PrrXp38QjOAcLtIXCGbWAQRbiuRRUSMIj39iY25sVsdfGhCcjzUix7TyMKh6sfnD8PL0w9sHP7/9zaCUNDJDMvh2XC3YBBCsIsrRnnx3oex2fY5iyHcfu2KAzrCAveV0NFhUh6ujFu7gOXQGXbjnHm51fgErSZlY"
                        },
                        {
                            "type": "receive",
                            "time": 1740470525.570476,
                            "opcode": 2,
                            "data": "oALKeJy9mMtuEzEUhs8kQZ2kINHseIHuQLbP8W2BhChC6hqxgE01JEMVqbmQC1Kfh5fhDXgdZtINCzuesR2yiKJMYn06t/8/nsIQis0UBsf3IYy/1fvdzfqw2o8Ailcwmq3ndfMRfsOofXQFYgoXMGw+X7z7+vLXn8nbHzDePFSP9fZuMS/hkoRReH09r5dreNb87Hbe/r2A8WL3cVvX7+t9AVDODtttvZo9ljD8/OkDPN9s198XD/XtsrqvSyirn6/lm83qHsrDrt6uqmXz5aQ98g6ReBzC4H8iWMYMZYiCcCNIoQmjEPpHoRvCF3h6/Ysw0UbKxCCM2zwoNwLn1soYhH5BSES4RIvcZgiD9mSiOV6JKIb+cUhhIIaMZegJ60kFaVIBBNMg6AwIxo1AWlsThdC/LRMQtLLSZChI9DUFSaWjGPoXZBKDZsnDoU2F9k1ItBRA4KitOodajo8IClmoK90EGcSyMwFKLlNj0JaCYB69JoEsiqF/OaYwcEKZY0Zz8o0GiaF6VGRtDveGbgRDgoXk0o3QvyATELh2ZSJbFEiFTYMbIVsUuiAgURa99thozjCoVG6EbE6+CwKRtDncG/cwSCOIRzFETIYEBquMOotSPSFoVDrk3twI2aqhC4IUivEMUeAembBMhNrSjdA/CgkIHJXKMR99Th5N0Lu5EfpHIQVB5tnxfSOaGQxZJ9O4/VS5bgeD8qx1yIwIDQY3Q//hlMKgSKPIYSE924QWKtgUboYIC5nA0KzhmEOyPQhoLIb00o3QvzETELQQNjUKp8y85SiCaz6ROefdl0C0wc50MuS7/OrCwJWROXLBfXLFpAouVk6GCPuUwGCMwNR6OHEbq4zQNgoh24VwFwRthEm9fztmwlORVnMd0kw3Q0Q1JDAoK5PN9KkJxZEkg2JWwtVhM6/29c3xqH1z8A6KaggvmoeD4i+iAYUy"
                        },
                        {
                            "type": "receive",
                            "time": 1740470525.901041,
                            "opcode": 2,
                            "data": "oALPeJy9mMtuEzEUhs8kQZ0kINE8RFeAbJ/j2wIJUYTUNWIBm2pIhipScyEXpD4PL8Mb8DrMpBsWdjxju2QRRZnE+vSf2+8zgyEU2xkMTu9DGH+rD/vrzXF9GAEUr2A03yzq5iP8hlH76BLEDC5g2Hy+ePf15a8/k7c/YLy9rx7q3e1yUcKUhFF4dbWoVxt41vzsZtH+vYDxcv9xV9fv60MBUM6Pu129nj+UMPz86QM83+4235f39c2quqtLKKufr+Wb7foOyuO+3q2rVfPlpD3yFpF4HMLgfyJYxgxlUEG4EaTQhFEI/VXohvAFHl//Iky0kTJRhHEbB+VG4NxaGYPQT4REhCla5DaDDNoTieZ4JaIY+uuQwkAMGctQE9YTCtKkAgimQdAZEIwbgbS2Jgqhf1kmIGhlpcmQkOgrCpJKRzH0T8gkBs2Sm0MbCu3rkGgpgMBRW/UU03J8QlDIQlXpJsgwLDsToOQyVYM2FQTzzGsSyKIY+qdjCgMnlDl6NCdfa5AYykdF1uZwb+hGMCRYaFy6EfonZAIC165IZFOBVNg0uBGyqdAFAYmyzGuPjeYMg5PKjZDNyXdBIJI2h3vjHgZpBPEohojOkMBglVFPMqkeETQqHXJvboRs2dAFQQrFeAYVuGdMWCZCZelG6K9CAgJHpXL0R5+TRxP0bm6E/irEI0yE5DlSweMetWEiVJNc5tky+IYEMxi0j80gyWHefKZFcasCa4apae48qaalZVCeyy0yEwyFm6F/i05hUKRR5DDSnjuVFirYGtwMEUY6gcEixxzGxYOAxmLINbgR+renBAQthE1V4dyVxnIUwWUHkXnKDaBAtMHKdDLkWwF2YdBoZOqsOHu95MhDseDKyBz5wH3GgUkVvOI6GSKMbAKDMQJTc/LMXlwZoW0UQrbV/AkBinkJl8ftojrU16eTDs25eyiqIbxoHg6Kv62QhLo="
                        },
                        {
                            "type": "receive",
                            "time": 1740470526.188817,
                            "opcode": 2,
                            "data": "oALWeJy9mM2O0zAQxydt0aYtSGwfYm8gj8ce2wckYBHSnhEHuKxKG1aVth/0A2mfh5fhDXgdkt0LB7tuYpceoihJrZ/m8z8zgT4Umwn0Hq99GH6r9rvr9WG1HwAU72AwW8+r+hZ+w6B5dQlyAhfQr+8v3n59+evP6M0PGG7upw/V9nYxL2GspGW6uppXyzU8qz+7mTd/L2C42H3cVtX7al8AlLPDdlutZg8l9D9/+gDPN9v198V9dbOc3lUllNOfr/TrzeoOysOu2q6my/rhqDnylkhhN4Te/0SQbJxMtMKwRkDyMzTniwiDE8KqDJ6QfgQtjaJOCO09cRrCF3j6/YswMlbrDI7Q7EdAdE53QWhnhESEMTlCl8EMJuCJ+niWnRja2yGFQQkSIkNOuIArlFEcQbA1gsmAYP0IyhhnOyG0T8sEBMNO2wwBSaGkUJpNJ4b2AZnEYERycWhcYUIVkpyKICAZx+fo2MNHBCYRy0o/QYaGfTIBadSpNmhCQYqAZlCSRCeG9uGYwoCKdI4ajSpUGjTF4pGVczkUZEA6WSVFrF36EdoHZAICGp8nsllBcVw0+BGyWeEUBFIqS78OSHkUFO1UfoRs08QpCEppl0O9YYBBW6mwE0OHypDA4NjyWTrVE4IhNjH15kfIFg2nIGjJAjNYAQNtwgkZS0s/QnsrJCAgMeeojyElTzaq3fwI7a3QHWEkNeYIhYB6NFbIWE6izrNlCDUJYSkqH+tGkkO8hUQLo+PImmFs65knVbQ0DBwYbknYqCv8DO1LdAoDK0M5Fl8yMFMZydHS4GfoIKQTGBwh5RAuAQSyjmKqwY/QvjwlIBgpXaoVjo00DklGlx1K2XNuACWRi2amlyHfCvAUBkNWp/aKo+MlEsZ8gWx1jnjAkHAQmqMjrpehg5BNYLBWUmpMHtmLs5XGQTEr4fKwmU/31fXjSfv63B0U0z68qF/2ir80R4c8"
                        }
                    ],
                    "cache": {},
                    "pageref": "page_5",
                    "request": {
                        "method": "GET",
                        "url": "wss://app-demo.spribe.io/BlueBox/websocket",
                        "httpVersion": "HTTP/1.1",
                        "headers": [
                            {
                                "name": "Upgrade",
                                "value": "websocket"
                            },
                            {
                                "name": "Origin",
                                "value": "https://aviator-demo.spribegaming.com"
                            },
                            {
                                "name": "Cache-Control",
                                "value": "no-cache"
                            },
                            {
                                "name": "Accept-Language",
                                "value": "zh-CN,zh;q=0.9"
                            },
                            {
                                "name": "Pragma",
                                "value": "no-cache"
                            },
                            {
                                "name": "Connection",
                                "value": "Upgrade"
                            },
                            {
                                "name": "Sec-WebSocket-Key",
                                "value": "lV4FThqXqsb2q7GQ5uYfmQ=="
                            },
                            {
                                "name": "Accept-Encoding",
                                "value": "gzip, deflate, br, zstd"
                            },
                            {
                                "name": "User-Agent",
                                "value": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
                            },
                            {
                                "name": "Sec-WebSocket-Version",
                                "value": "13"
                            },
                            {
                                "name": "Host",
                                "value": "app-demo.spribe.io"
                            },
                            {
                                "name": "Sec-WebSocket-Extensions",
                                "value": "permessage-deflate; client_max_window_bits"
                            }
                        ],
                        "queryString": [],
                        "cookies": [],
                        "headersSize": 558,
                        "bodySize": 0
                    },
                    "response": {
                        "status": 101,
                        "statusText": "",
                        "httpVersion": "HTTP/1.1",
                        "headers": [
                            {
                                "name": "Upgrade",
                                "value": "websocket"
                            },
                            {
                                "name": "Connection",
                                "value": "upgrade"
                            },
                            {
                                "name": "Via",
                                "value": "1.1 49c0e915959b33a246af064858d46eb2.cloudfront.net (CloudFront)"
                            },
                            {
                                "name": "Alt-Svc",
                                "value": "h3=\":443\"; ma=86400"
                            },
                            {
                                "name": "X-Cache",
                                "value": "Miss from cloudfront"
                            },
                            {
                                "name": "X-Amz-Cf-Id",
                                "value": "CO2x1qMb_mEha9RtQai1dgcL1SBoCdXXSxOImtqi18aSN_HzN9WDOQ=="
                            },
                            {
                                "name": "Date",
                                "value": "Tue, 25 Feb 2025 08:02:03 GMT"
                            },
                            {
                                "name": "X-Amz-Cf-Pop",
                                "value": "LAX54-P3"
                            },
                            {
                                "name": "Sec-WebSocket-Accept",
                                "value": "NtVYMu25ZMvt/eLm+FTgTwIdjPU="
                            },
                            {
                                "name": "Sec-WebSocket-Extensions",
                                "value": "permessage-deflate;client_max_window_bits=15"
                            }
                        ],
                        "cookies": [],
                        "content": {
                            "size": 0,
                            "mimeType": "x-unknown",
                            "compression": 445
                        },
                        "redirectURL": "",
                        "headersSize": 445,
                        "bodySize": -445,
                        "_transferSize": 0,
                        "_error": null,
                        "_fetchedViaServiceWorker": false
                    },
                    "serverIPAddress": "",
                    "startedDateTime": "2025-02-25T08:02:02.217Z",
                    "time": 3971.634000001359,
                    "timings": {
                        "blocked": -1,
                        "dns": -1,
                        "ssl": -1,
                        "connect": -1,
                        "send": 0,
                        "wait": 3971.634000001359,
                        "receive": 0,
                        "_blocked_queueing": -1
                    }
                }
            ]
        }
    }).log.entries[0]
}