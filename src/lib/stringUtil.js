const randomString = (
  len = 12,
  chrs = "abcdefghijklmnopqrstuvwxyz"
) => {
  let str = ""
  const chrsLen = chrs.length
  while (len-- > 0) str+=chrs[Math.random()*chrsLen | 0]
  return str
}

module.exports = {
  randomString
}
