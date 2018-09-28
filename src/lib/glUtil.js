const THREE = require('three')

function makePositionBuffer(position, bottomLeft, bottomRight, topRight, topLeft) {

		var bufferIndex = 0
    position[bufferIndex++] = bottomLeft.x
    position[bufferIndex++] = bottomLeft.y
    position[bufferIndex++] = 0
    position[bufferIndex++] = bottomRight.x
    position[bufferIndex++] = bottomRight.y
    position[bufferIndex++] = 0
    position[bufferIndex++] = topRight.x
    position[bufferIndex++] = topRight.y
    position[bufferIndex++] = 0
    position[bufferIndex++] = topLeft.x
    position[bufferIndex++] = topLeft.y
    position[bufferIndex++] = 0

    return position
}

function makeUVBuffer(uvs, bottomLeft, bottomRight, topRight, topLeft) {

		var bufferIndex = 0
    uvs[bufferIndex++] = bottomLeft.x
    uvs[bufferIndex++] = bottomLeft.y
    uvs[bufferIndex++] = bottomRight.x
    uvs[bufferIndex++] = bottomRight.y
    uvs[bufferIndex++] = topRight.x
    uvs[bufferIndex++] = topRight.y
    uvs[bufferIndex++] = topLeft.x
    uvs[bufferIndex++] = topLeft.y

    return uvs
}

function makeWarpBuffer(warp, bottomLeft, bottomRight, topRight, topLeft) {
		var ax = topRight.x - bottomLeft.x;
		var ay = topRight.y - bottomLeft.y;
		var bx = topLeft.x - bottomRight.x;
		var by = topLeft.y - bottomRight.y;
  	var cross = ax * by - ay * bx;

		if (cross != 0) {
			var cy = bottomLeft.y - bottomRight.y;
			var cx = bottomLeft.x - bottomRight.x;

			var s = (ax * cy - ay * cx) / cross;

			if (s > 0 && s < 1) {
				var t = (bx * cy - by * cx) / cross;

				if (t > 0 && t < 1) {
					//uv coordinates for texture
					var u0 = 0 // texture bottom left u
					var v0 = 0 // texture bottom left v
					var u2 = 1 // texture top right u
					var v2 = 1 // texture top right v

					var bufferIndex = 0;

					var q0 = 1 / (1 - t)
					var q1 = 1 / (1 - s)
					var q2 = 1 / t
					var q3 = 1 / s

          // bl
					warp[bufferIndex++] = u0 * q0
					warp[bufferIndex++] = v2 * q0
					warp[bufferIndex++] = q0

					warp[bufferIndex++] = u2 * q1;
					warp[bufferIndex++] = v2 * q1;
					warp[bufferIndex++] = q1;

					warp[bufferIndex++] = u2 * q2;
					warp[bufferIndex++] = v0 * q2;
					warp[bufferIndex++] = q2;

					warp[bufferIndex++] = u0 * q3;
					warp[bufferIndex++] = v0 * q3;
					warp[bufferIndex++] = q3;

				}
			}
		}
    return warp
}

function makeNormalBuffer(normal, bottomLeft, bottomRight, topRight) {

    const MULT = 32767 // MAX INT

    var pA = new THREE.Vector3(bottomLeft.x, bottomLeft.y, 0.)
    var pB = new THREE.Vector3(bottomRight.x, bottomRight.y, 0.)
    var pC = new THREE.Vector3(topRight.x, topRight.y, 0.)

    var cb = new THREE.Vector3()
    var ab = new THREE.Vector3()

    // tri 1 is enough
		cb.subVectors(pC, pB)
		ab.subVectors(pA, pB)
		cb.cross(ab)
		cb.normalize()

    cb.multiplyScalar(MULT)

    var bufferIndex = 0
    for (bufferIndex; bufferIndex<normal.length; bufferIndex+=3) {
  		normal[bufferIndex] = cb.x;
  		normal[bufferIndex+1] = cb.y;
  		normal[bufferIndex+2] = cb.z;
    }
    return normal
}

module.exports = {
  makeNormalBuffer,
  makeWarpBuffer,
  makeUVBuffer,
  makePositionBuffer
}
