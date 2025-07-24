import axios from 'axios'

const lc = {
    baseurl: 'http://localhost:3030',
    api: '/system/copyright',
}

axios.get(lc.baseurl + lc.api).then(res => {
    console.log('数据=>', res.data)
}).catch(err => {
    console.error('错误->', err.stack)
})