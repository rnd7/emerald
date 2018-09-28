function makeDefaultSlide() {
  return {
    name: "",
    files:[],
    fps: 60,
    scale: .3,
    maxRotation: .5,
    in: 2000,
    pick: 5000,
    startScale: 10,
    startX: 0,
    startY: 0,
    randomX: 0,
    randomY: 0,
    targetX: 0,
    targetY: 0,
    targetRandomX: 1,
    targetRandomY: 1,
    width: 1024,
    height: 1024
  }
}

function makeDefaultMask() {
  return [
    {x: -1, y: -1},
    {x: 1, y: -1},
    {x: 1, y: 1},
    {x: -1, y: 1},
  ]
}

function makeDefaultSurface() {
  return {
    name: "",
    a: {x: -1, y: -1},
    b: {x: 1, y: -1},
    c: {x: 1, y: 1},
    d: {x: -1, y: 1},
    mask: makeDefaultMask(),
    texture: null
  }
}

function makeDefaultState() {
  return {
    page: "slides",
    surfaces: { },
    slides: { },
    activePoint: null,
    activeSurface: null,
    activeSlide: null,
    master: 1.0,
  }
}

function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

module.exports = {
  makeDefaultSlide,
  makeDefaultState,
  makeDefaultSurface,
  makeDefaultMask,
  clone
}
