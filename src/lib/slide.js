// Imports
const THREE = require('three')
const { loader } = require('./textureLoader.js')

const planeGeometry = new THREE.PlaneBufferGeometry( 1, 1, 1, 1 );
function makeSlide(renderer) {
  const t = {}
  t.renderer = renderer || new THREE.WebGLRenderer({ antialias: false, alpha: false })
  //t.renderer.setClearColor( 0xFFFFFF, 1. );
  t.renderer.setClearColor( 0x0, 1. );
  t.renderer.setPixelRatio(window.devicePixelRatio)
  //t.renderer.setSize(width, height)

  let width = 1024
  let height = 1024

  t.buffer = new THREE.WebGLRenderTarget(
      width, height,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
        stencilBuffer: false,
      }
  )


  t.backBuffer = new THREE.WebGLRenderTarget(
      width, height,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
        stencilBuffer: false,
      }
  )

  t.backGeometry = new THREE.PlaneBufferGeometry( 2, 2, 1, 1 );
  t.backMaterial = new THREE.MeshBasicMaterial( {color: 0xFFFFFF, side: THREE.FrontSide} );
  t.backMaterial.map = t.backBuffer.texture
  t.backPlane = new THREE.Mesh( t.backGeometry, t.backMaterial );
  t.scene = new THREE.Scene()
  t.aniScene = new THREE.Scene()
  t.aniScene.add( t.backPlane );

  t.startZ = 9
  t.files = []
  t.inTime = 1000
  t.pickInterval = 5000
  t.maxRotation = .5
  t.startScale = 10
  t.startX = 0
  t.startY = 0
  t.targetX = 0
  t.targetY = 0
  t.randomX = 0
  t.randomY = 0
  t.targetRandomX = 1
  t.targetRandomY = 1

  t.renderNeccessary = false
  t.last = 0
  t.fps = 30
  t.scale = .3

  //t.camera = new THREE.PerspectiveCamera( 45, width / height, .001, 100)
  t.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 3)
  t.camera.position.z = 2

  //t.camera = new THREE.PerspectiveCamera( 45, width / height, .001, 100)
  t.backCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 3)
  t.backCamera.position.z = 2


  t.planes = []
  t.lastPick = Date.now()
  t.pick = () => {
    t.lastPick = Date.now()
    t.addFile(t.files[(Math.random() * t.files.length)|0])
  }

  t.setSize = (w, h) => {
    if (w!=width || h!=height) {
      width = w
      height = h
      t.resize()
    }
  }
  t.resize = () => {
    t.buffer.setSize(width, height)
    t.backBuffer.setSize(width, height)
    t.camera.aspect = width/height;
    t.camera.left = -1
    t.camera.right = 1
    t.camera.top = 1/t.camera.aspect
    t.camera.bottom = -1/t.camera.aspect
    //t.backPlane.position.y = -1/t.camera.aspec
    //t.backPlane.scale.x = t.camera.aspect
    //t.backPlane.scale.y = 1/t.camera.aspect
    t.camera.updateProjectionMatrix()
    t.render()
  }
  t.addFile = (path) => {
    console.log("addFile", path)
    t.pending = true
    loader.load(
      path,
      (error, texture ) => {
        console.log("loader result", error, texture)
        t.pending = false
        if (error) return console.error( 'An error happened.', error);
        var material = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.FrontSide,
          map: texture,
          transparent: true
        });
        material.depthTest = false
        material.flatShading = false
        material.fog = false
        material.lights = false
        let plane = new THREE.Mesh( planeGeometry, material );
        /*const sh = Math.tan(t.camera.fov * Math.PI / 180 * .5) * (t.camera.position.z-t.startZ) * 2
        const sw = sh * t.camera.aspect
        const h = Math.tan(t.camera.fov * Math.PI / 180 * .5) * t.camera.position.z * 2
        const w = h * t.camera.aspect*/
        plane.position.x = t.startX + (Math.random() * 2-1) * t.randomX
        plane.position.y = t.startY + (Math.random() * 2-1) * t.randomY/t.camera.aspect
        plane.position.z = 0
        plane.rotation.z = (Math.random()-.5) * Math.PI * t.maxRotation
        plane.material.opacity = 0.
        const baseScaleX = t.scale
        const baseScaleY = texture.image.height/texture.image.width*t.scale
        plane.scale.x = baseScaleX * t.startScale
        plane.scale.y = baseScaleY * t.startScale
        t.planes.push({
          mesh: plane,
          startX: plane.position.x,
          startX: plane.position.y,
          startScaleX: plane.scale.x,
          startScaleY: plane.scale.y,
          targetScaleX: baseScaleX,
          targetScaleY: baseScaleY,
          targetX: t.targetX + (Math.random() * 2-1) * t.targetRandomX,
          targetY: t.targetY + (Math.random() * 2-1) * t.targetRandomY/t.camera.aspect ,
          startRotation: plane.rotation.z,
          targetRotation: (Math.random()-.5) * Math.PI * t.maxRotation,
          startTime: Date.now(),
          phase: "IN",
          destroy: () => {
            for (let i = t.planes.length-1; i>=0; i--) {
              if(t.planes[i].mesh === plane) {
                t.planes.splice(i, 1)
                break;
              }
            }
            plane.material.map.dispose()
            plane.material.dispose()
            plane.geometry.dispose()
            t.scene.remove(plane)
          }
        })
        t.aniScene.add(plane)
      }
    )
  }

  t.destroy = () => {
    t.planes.forEach(plane => { plane.destroy() })
    t.scene = null
    t.renderer = null
    t.camera = null
  }

  t.pending = false

  t.animate = () => {
    const now = Date.now()
    const delta = Math.max(0, now-t.last)
    if (!t.pending && t.files.length && now > t.lastPick + t.pickInterval ) t.pick()

    if (delta >= 1000/t.fps) {
      t.renderNeccessary = false
      const pLen = t.planes.length
      let i
      let plane
      for (i = 0; i<t.planes.length; i++) {
        plane = t.planes[i]
        const currentTime = Math.max(0, t.last - plane.startTime)
        const timeLeft =  Math.max(0, t.inTime - currentTime)
        const q = Math.max(1, timeLeft/delta)
        if(timeLeft > 0) {
          const mesh = plane.mesh
          mesh.position.x += (plane.targetX - mesh.position.x) / q
          mesh.position.y += (plane.targetY - mesh.position.y) / q
          mesh.scale.x += (plane.targetScaleX - mesh.scale.x) / q
          mesh.scale.y += (plane.targetScaleY - mesh.scale.y) / q
          mesh.rotation.z += (plane.targetRotation - mesh.rotation.z) / q
          mesh.material.opacity += (1 - mesh.material.opacity) / q
          t.renderNeccessary = true
        } else {
          t.aniScene.remove(plane.mesh)
          t.scene.add(plane.mesh)
          t.renderer.autoClear = false
          t.renderer.render(t.scene, t.backCamera, t.backBuffer)
          t.renderer.autoClear = true
          t.renderNeccessary = true
          //t.renderer.render(t.aniScene, t.camera, t.buffer)
          plane.destroy()
        }

      }
      t.last = now
    }
  }

  t.render = () => {
    t.renderer.render(t.aniScene, t.camera, t.buffer)
  }
  t.resize()
  return t
}


module.exports = {
  makeSlide: makeSlide
}
