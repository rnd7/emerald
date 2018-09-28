// Imports
const THREE = require('three')
const { clone } = require('./data.js')
const {
  makeNormalBuffer,
  makeWarpBuffer,
  makeUVBuffer,
  makePositionBuffer
} = require('./glUtil.js')

const WarpShader = {
	uniforms: {
    "mask": { value: null },
    "diffuse": { value: null },
    "globalW": { value: 512 },
    "globalH": { value: 512 },
    "master": { value: 1. },
	},
	vertexShader: [
    "attribute vec3 warp;",
    "uniform float globalW;",
    "uniform float globalH;",
    "varying vec2 vUv;",
    "varying vec3 vWarp;",
    "void main() {",
			"vUv = uv * vec2(globalW/globalH);",
      "vWarp = warp;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join( "\n" ),
	fragmentShader: [
    "uniform sampler2D mask;",
    "uniform sampler2D diffuse;",
    "uniform float globalW;",
    "uniform float globalH;",
    "uniform float master;",
    "varying vec2 vUv;",
    "varying vec3 vWarp;",
    "void main() {",
      "vec2 uvq = vec2(vWarp.x/vWarp.z, (1.-vWarp.y/vWarp.z));",
      "vec4 diffuseCol = texture2D(diffuse, uvq);",
      "vec4 maskCol = texture2D(mask, gl_FragCoord.xy / vec2(globalW, globalH));",
      "gl_FragColor = vec4(diffuseCol.rgb * master * maskCol.r, maskCol.r);",
    "}",
	].join( "\n" )
}


function makeSurface(surfaceData) {
  const t = {}

  t.geometry = new THREE.BufferGeometry()


  // bl , br, tr, tl
  t.a = new THREE.Vector2(-1, -1)
  t.b = new THREE.Vector2(1, -1)
  t.c = new THREE.Vector2(1, 1)
  t.d = new THREE.Vector2(-1, 1)

  var position = new Float32Array(4*3)
  var warp = new Float32Array(4*3);
  var normal = new Float32Array(4*3)
  var uv = new Float32Array(4*2)

  makePositionBuffer(position, t.a, t.b, t.c, t.d)
  makeWarpBuffer(warp, t.a, t.b, t.c, t.d)
  makeNormalBuffer(normal, t.a, t.b, t.c) // from first tri only
  makeUVBuffer(
    uv,
    new THREE.Vector2(0, 0),
    new THREE.Vector2(1, 0),
    new THREE.Vector2(1, 1),
    new THREE.Vector2(0, 1)
  )
  var index = new Uint32Array([
    0, 1, 2, 2, 3, 0
  ])

	t.geometry.setIndex( new THREE.BufferAttribute(index, 1) );
  t.geometry.addAttribute('position', new THREE.BufferAttribute(position, 3));
  t.geometry.addAttribute('uv', new THREE.BufferAttribute(uv, 2, true));
  t.geometry.addAttribute('warp', new THREE.BufferAttribute(warp, 3));
	t.geometry.addAttribute('normal', new THREE.BufferAttribute( normal, 3, true ) );

  t.material = new THREE.ShaderMaterial(clone(WarpShader))

  let maskWidth = 1024
  let maskHeight = 1024
  t.mask = makeMask()
  t.maskBuffer = new THREE.WebGLRenderTarget(
    maskWidth, maskHeight,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false
    }
  )
  t.material.uniforms.mask.value = t.maskBuffer.texture
  t.material.transparent = true;
  t.mesh = new THREE.Mesh(t.geometry, t.material)
  t.mesh.position.z = 0

  t.updatePoints = function() {
    makePositionBuffer(position, t.a, t.b, t.c, t.d)
    makeWarpBuffer(warp, t.a, t.b, t.c, t.d)
    t.geometry.attributes.position.needsUpdate = true;
    t.geometry.attributes.warp.needsUpdate = true;
  }

  let lastTex = null
  t.setTexture = function(texture) {
    if (lastTex === texture) return
    t.material.uniforms.diffuse.value = texture
  }

  t.update = (surfaceData) => {
    t.a.x = Math.min(1, Math.max(-1, surfaceData.a.x))
    t.a.y = Math.min(1, Math.max(-1, surfaceData.a.y))
    t.b.x = Math.min(1, Math.max(-1, surfaceData.b.x))
    t.b.y = Math.min(1, Math.max(-1, surfaceData.b.y))
    t.c.x = Math.min(1, Math.max(-1, surfaceData.c.x))
    t.c.y = Math.min(1, Math.max(-1, surfaceData.c.y))
    t.d.x = Math.min(1, Math.max(-1, surfaceData.d.x))
    t.d.y = Math.min(1, Math.max(-1, surfaceData.d.y))
    t.updatePoints()

  }
  t.update(surfaceData)
  return t
}

function init(renderer, domElement) {
  const t = {}
  t.domElement = domElement
  // instantiate a loader
  var loader = new THREE.TextureLoader();
  var width = 512
  var height = 512




  t.renderer =  renderer || new THREE.WebGLRenderer({ antialias: false, alpha: false, stencil: false, powerPreference: "high-performance", depth: true, precision: "mediump" })
  //t.renderer.setClearColor( 0xFFFFFF, 1. );
  t.renderer.setClearColor( 0x0, 1. );
  t.renderer.setPixelRatio(window.devicePixelRatio)
  //t.renderer.setSize(width, height)

  t.raycaster = new THREE.Raycaster()

  t.domElement.appendChild(t.renderer.domElement)

  t.scene = new THREE.Scene()
  t.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 3)
  t.camera.position.z = 2

  t.surfaceGroup = new THREE.Group()
  t.scene.add(t.surfaceGroup)

  t.pointHelperGroup = new THREE.Group()
  t.pointHelperGroup.position.z = 1
  t.scene.add(t.pointHelperGroup)
  t.pointHelper = makePointHelper()

  t.maskHelperGroup = new THREE.Group()
  t.maskHelperGroup.position.z = 1
  t.scene.add(t.maskHelperGroup)
  t.maskHelper = makeMaskHelper()

  t.master = 1.

  t.surfaces = {}
  t.surfacesById = {}

  t.resize = (e) => {
    const w = t.domElement.offsetWidth
    const h = t.domElement.offsetHeight
    if (width != w  || height != h) {
      width = w
      height = h
      t.pointHelper.setScale(1/width, 1/height)
      t.maskHelper.setScale(1/width, 1/height)
      t.renderer.setSize(width, height, true)
      t.camera.aspect = width / height;
      for (let surfaceId in t.surfaces) {
        t.surfaces[surfaceId].material.uniforms.globalW.value = width
        t.surfaces[surfaceId].material.uniforms.globalH.value = height
      }
      t.camera.updateProjectionMatrix()
      t.render()
    }

  }

  t.setMaster = (value) => {
    t.master = value
    for (let surfaceId in t.surfaces) {
      t.surfaces[surfaceId].material.uniforms.master.value = value
    }
    t.render()
  }

  t.getSurfaceMaskPoints = (surfaceId) => {
    return t.surfaces[surfaceId].mask.points.map((p) => {
      return {x: p.x, y: p.y}
    })
  }

  t.getSurfacePoints = (surfaceId) => {
    return {
      a: {
        x: t.surfaces[surfaceId].a.x,
        y: t.surfaces[surfaceId].a.y,
      },
      b: {
        x: t.surfaces[surfaceId].b.x,
        y: t.surfaces[surfaceId].b.y,
      },
      c: {
        x: t.surfaces[surfaceId].c.x,
        y: t.surfaces[surfaceId].c.y,
      },
      d: {
        x: t.surfaces[surfaceId].d.x,
        y: t.surfaces[surfaceId].d.y,
      }
    }
  }

  t.getSurfaces = () => {
    const result = {}
    for (let surfaceId in t.surfaces) {
      result[surfaceId] = t.getSurfacePoints(surfaceId)
    }
    return result
  }

  t.setSurface = (id, data) => {
    if(t.surfaces[id]) {
      t.surfaces[id].update(data)
      if (data.mask) t.setSurfaceMaskPoints(id, data.mask)
    } else {
      t.surfaces[id] = makeSurface(data)
      t.surfaces[id].material.uniforms.master.value = t.master
      t.surfaces[id].material.uniforms.globalW.value = width
      t.surfaces[id].material.uniforms.globalH.value = height
      if (data.mask) t.setSurfaceMaskPoints(id, data.mask)
      t.surfacesById[t.surfaces[id].mesh.uuid] = id
      t.surfaceGroup.add(t.surfaces[id].mesh)
    }
    t.render()
  }

  t.setSurfaces = (data) => {
    const removal = Object.keys(t.surfaces)
    for (var surfaceId in data) {
      const removalIndex = removal.indexOf(surfaceId)
      if (removalIndex != -1) {
        removal.splice(removalIndex, 1)
      }
      const surface = data[surfaceId]
      t.setSurface(surfaceId, data[surfaceId])
    }
    // remove obsolete
    removal.forEach((surfaceId) => {
      t.removeSurface(surfaceId)
    })
    t.render()
  }

  t.removeSurface = (surfaceId) => {
    t.surfaceGroup.remove(t.surfaces[surfaceId].mesh)
    t.surfaces[surfaceId].mesh.geometry.dispose()
    t.surfaces[surfaceId].material.dispose()
    t.surfaces[surfaceId].maskBuffer.dispose()
    delete t.surfacesById[t.surfaces[surfaceId].mesh.uuid]
    delete t.surfaces[surfaceId]
  }

  t.renderSurfaceMask = (surfaceId) => {
    const surface = t.surfaces[surfaceId]
    t.renderer.render(
      surface.mask.scene,
      surface.mask.camera,
      surface.maskBuffer
    )
  }

  t.setSurfaceMaskPoints = (surfaceId, points) => {
    const surface = t.surfaces[surfaceId]
    surface.mask.setPoints(points)
    t.renderSurfaceMask(surfaceId)
    t.render()
  }

  t.moveSurfaceMaskPoint = (surfaceId, pointIndex, dx, dy) => {
    const vec = new THREE.Vector2((dx/width)*2, (dy/height)*2)
    vec.y *=-1
    const surface = t.surfaces[surfaceId]
    surface.mask.points[pointIndex].x += vec.x
    surface.mask.points[pointIndex].y += vec.y
    surface.mask.points[pointIndex].x = Math.min(1, Math.max(-1, surface.mask.points[pointIndex].x))
    surface.mask.points[pointIndex].y = Math.min(1, Math.max(-1, surface.mask.points[pointIndex].y))
    t.surfaces[surfaceId].mask.updatePoints()
    t.renderSurfaceMask(surfaceId)
    t.maskHelper.group.children[pointIndex].position.x = surface.mask.points[pointIndex].x
    t.maskHelper.group.children[pointIndex].position.y = surface.mask.points[pointIndex].y
    t.render()
  }

  t.render = () => {
    t.renderer.render(t.scene, t.camera)
  }

  t.findSurface = (x, y) => {
    const vec = new THREE.Vector2((x/width)*2-1, (y/height)*2-1)
    vec.y *=-1
    t.raycaster.setFromCamera(vec, t.camera)
    const intersections = t.raycaster.intersectObjects(t.surfaceGroup.children)
    let result = []
    for ( var i = 0; i < intersections.length; i++ ) {
      result.push(t.surfacesById[intersections[i].object.uuid])
  	}
    return result

  }

  t.findPoint = (x, y) => {
    if(!t.pointHelper.group.visible) return []
    const vec = new THREE.Vector2((x/width)*2-1, (y/height)*2-1)
    vec.y *=-1
    t.raycaster.setFromCamera(vec, t.camera)
    const intersections = t.raycaster.intersectObjects(t.pointHelper.group.children)
    let result = []
    for ( var i = 0; i < intersections.length; i++ ) {
      result.push(intersections[i].object.name)
  	}
    return result

  }

  t.findMaskPoint = (x, y) => {
    if(!t.maskHelper.group.visible) return []
    const vec = new THREE.Vector2((x/width)*2-1, (y/height)*2-1)
    vec.y *=-1
    t.raycaster.setFromCamera(vec, t.camera)
    const intersections = t.raycaster.intersectObjects(t.maskHelper.group.children)
    let result = []
    for ( var i = 0; i < intersections.length; i++ ) {
      result.push(parseInt(intersections[i].object.name))
  	}
    return result
  }

  t.showMaskHelper = (surfaceId) => {
    t.maskHelper.setPoints(t.surfaces[surfaceId].mask.points)
    t.maskHelperGroup.add(t.maskHelper.group)
    t.render()
  }

  t.hideMaskHelper = () => {
    t.maskHelperGroup.remove(t.maskHelper.group)
    t.render()
  }

  t.showPoints = (surfaceId) => {
    t.updatePointHelper(t.surfaces[surfaceId])
    t.pointHelperGroup.add(t.pointHelper.group)
    t.render()
  }

  t.hidePoints = () => {
    t.pointHelperGroup.remove(t.pointHelper.group)
    t.render()
  }

  t.setSurfaceTexture = (surfaceId, texture) => {
    t.surfaces[surfaceId].setTexture(texture)
    t.render()
  }

  t.moveSurfacePoint = (surfaceId, pointName, dx, dy) => {
    const vec = new THREE.Vector2((dx/width)*2, (dy/height)*2)
    vec.y *=-1
    t.surfaces[surfaceId][pointName].x += vec.x
    t.surfaces[surfaceId][pointName].y += vec.y
    t.surfaces[surfaceId][pointName].x = Math.min(1, Math.max(-1, t.surfaces[surfaceId][pointName].x))
    t.surfaces[surfaceId][pointName].y = Math.min(1, Math.max(-1, t.surfaces[surfaceId][pointName].y))
    t.surfaces[surfaceId].updatePoints()
    t.pointHelper[pointName].position.x = t.surfaces[surfaceId][pointName].x
    t.pointHelper[pointName].position.y = t.surfaces[surfaceId][pointName].y
    t.render()
  }

  t.updatePointHelper = (surface) => {
    t.pointHelper.a.position.x = surface.a.x
    t.pointHelper.a.position.y = surface.a.y
    t.pointHelper.b.position.x = surface.b.x
    t.pointHelper.b.position.y = surface.b.y
    t.pointHelper.c.position.x = surface.c.x
    t.pointHelper.c.position.y = surface.c.y
    t.pointHelper.d.position.x = surface.d.x
    t.pointHelper.d.position.y = surface.d.y
  }
  window.addEventListener("resize", t.resize)
  t.resize()
  return t
}

function makePointHelper() {
  const t = {}
  t.geometry = new THREE.CircleBufferGeometry( 40, 16 );
  t.material = new THREE.MeshBasicMaterial( { color: 0x243576  } );
  t.a = new THREE.Mesh(t.geometry, t.material );
  t.a.name = "a"
  t.b = new THREE.Mesh(t.geometry, t.material );
  t.b.name = "b"
  t.c = new THREE.Mesh(t.geometry, t.material );
  t.c.name = "c"
  t.d = new THREE.Mesh(t.geometry, t.material );
  t.d.name = "d"

  t.group = new THREE.Group()
  t.group.add(t.a)
  t.group.add(t.b)
  t.group.add(t.c)
  t.group.add(t.d)
  t.setScale = (sx, sy) => {
    t.a.scale.x = sx
    t.a.scale.y = sy
    t.b.scale.x = sx
    t.b.scale.y = sy
    t.c.scale.x = sx
    t.c.scale.y = sy
    t.d.scale.x = sx
    t.d.scale.y = sy

  }
  return t
}

function makeMaskHelper() {
  const t = {}
  t.geometry = new THREE.CircleBufferGeometry( 20, 16 )
  //776600
  t.material = new THREE.MeshBasicMaterial( { color:0x7485a6 } )
  t.scaleX = 1
  t.scaleY = 1
  t.group = new THREE.Group()

  t.setPoints = (points) => {
    t.removePoints()
    for (var i = 0; i<points.length; i++) {
      t.appendPoint(i, points[i].x, points[i].y)
    }
  }

  t.appendPoint = (index, x, y) => {
    let point = new THREE.Mesh(t.geometry, t.material)
    point.name = index
    point.position.x = x
    point.position.y = y
    point.scale.x = t.scaleX
    point.scale.y = t.scaleY
    t.group.add(point)
  }

  t.removePoints = () =>  {
    while(t.group.children.length){
      const point = t.group.children[t.group.children.length-1]
      point.geometry.dispose()
      point.material.dispose()
      t.group.remove(point)
    }
  }

  t.setScale = (sx, sy) => {
    t.scaleX = sx
    t.scaleY = sy
    t.group.children.forEach((point)=>{
      point.scale.x = t.scaleX
      point.scale.y = t.scaleY
    })
  }
  return t
}


function makeMask() {
  var t = {}
  t.points = [
    new THREE.Vector2(-1, -1),
    new THREE.Vector2(1, -1),
    new THREE.Vector2(1, 1),
    new THREE.Vector2(-1, 1)
  ]
  t.scene = new THREE.Scene()
  t.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 3)
  t.camera.position.z = 2;
  t.camera.updateProjectionMatrix()
  t.hasChanged = false
  t.material = new THREE.MeshBasicMaterial( {
    color: 0xFF0000,
    side: THREE.FrontSide,
  } )
  t.shape = null
  t.geometry = null
  t.mesh = null


  t.removeAll = function() {
    if (!t.shape) return
    t.scene.remove(t.mesh)
    t.mesh.geometry.dispose()
    t.shape = null
    t.mesh = null
  }

  t.setPoints = function(points) {
    t.points = []
    points.forEach((point) => {
      t.points.push(new THREE.Vector2(point.x, point.y))
    })

    t.updatePoints()
  }

  t.updatePoints = function() {
    t.removeAll()
    let pLen = t.points.length
    if(pLen < 3) return
    t.shape = new THREE.Shape()
    t.shape.moveTo(t.points[t.points.length-1].x, t.points[t.points.length-1].y)
    let i
    for (i = 0; i < pLen; i++) {
      t.shape.lineTo(t.points[i].x, t.points[i].y)
    }
    t.geometry = new THREE.ShapeGeometry(t.shape)

    t.mesh = new THREE.Mesh( t.geometry, t.material )
    t.scene.add(t.mesh)
    t.hasChanged = true
  }
  t.updatePoints()
  return t
}

module.exports = {
  init: init
}
