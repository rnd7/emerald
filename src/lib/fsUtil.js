const fs = require('fs')

const FILE_PATTERN = /.png$|.jpe?g$|.gif$/i
function walk(dir, done, recursive = 0) {
  var results = []
  fs.readdir(dir, function(err, list) {
    if (err) return done(err)
    var i = 0
    function next() {
      let file = list[i++]
      if (!file) return done(null, results);
      file = dir + '/' + file
      fs.stat(file, function(err, stat) {
        if (recursive && stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res)
            next()
          }, recursive-1)
        } else {
          if (FILE_PATTERN.test(file)) results.push(file)
          next()
        }
      })
    }
    next()
  })
}

module.exports = {
  walk
}
