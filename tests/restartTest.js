import axios from 'axios'

const lc = {
    baseurl: 'http://localhost:3030',
    api: '/system/restart',
}

axios.get(lc.baseurl + lc.api).then(res => {
    console.log('数据=>', res.data.length, res.data.map(e => e.path + ' ' + e.remark))
}).catch(err => {
    console.error('错误->', err.stack)
})