const THREE = require('three')

const textureLoader = new THREE.TextureLoader();
const cache = {}
const load = (path, callback) => {
  if (cache[path]) {
    cache[path].touched = Date.now()
    if (cache[path].pending) {
      console.log("cache pending", path)
      cache[path].callback.push(callback)
    } else {
      console.log("from cache", path)
      callback(cache[path].error, cache[path].texture)
    }
  } else {
    console.log("load image", path)
    const item = {
      pending: true,
      callback: [callback],
      texture: null,
      path: path,
      touched: Date.now(),
      error: null
    }
    cache[path] = item
    textureLoader.load(path, (texture) => {
      console.log("image loaded", path)
      //texture.generateMipmaps = true
      //texture.magFilter = THREE.LinearFilter
      //texture.minFilter = THREE.LinearFilter
      cache[path].texture = texture
      cache[path].pending = false
      while (cache[path].callback.length)
        cache[path].callback.pop()(cache[path].error, cache[path].texture)
    }, undefined, (e) => {
      console.log("error loading image", path)
      cache[path].error = e
      cache[path].pending = false
      while (cache[path].callback.length)
        cache[path].callback.pop()(cache[path].error)
    })
  }

}

module.exports = {
  loader: {
    load
  }
}
