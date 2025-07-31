/**
 * ws自动响应的数据示例
 */
export default async function (arr) {
  arr.push(...[
    {
      "type": "receive",
      "time": 1740470623630,
      "opcode": 2,
      "data": "1",
      "step": 0
    },
    {
      "type": "receive",
      "time": 1740470624666,
      "opcode": 2,
      "data": "2",
      "step": 1036
    },
    {
      "type": "receive",
      "time": 1740470624667,
      "opcode": 2,
      "data": "3",
      "step": 1
    },
    {
      "type": "receive",
      "time": 1740470624859,
      "opcode": 2,
      "data": "4",
      "step": 192
    },
    {
      "type": "receive",
      "time": 1740470624861,
      "opcode": 2,
      "data": "5",
      "step": 2
    }
  ])
  return arr;
}