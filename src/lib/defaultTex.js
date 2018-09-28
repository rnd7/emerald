
const THREE = require('three')

const CALIBRATION_IMAGE = '../assets/calibration.png'
const loader = new THREE.TextureLoader();
let pending = false
let texture
let error

let callbacks = []

function getTexture(callback) {
  if(pending) callbacks.push(callback)
  else if(texture) callback(texture)
  else {
    pending = true
    callbacks.push(callback)
    loader.load(
     CALIBRATION_IMAGE,
     (tex) => {
       texture = tex
       pending = false
       while(callbacks.length) callbacks.pop()(texture)
     },
     undefined,
     function ( err ) {
       texture = new THREE.Texture()
       pending = false
       console.error( 'An error happened.' );
     }
   )
  }
}

module.exports = {
  getTexture: getTexture
}
