import {
  BufferGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Quaternion,
  Vector3,
} from "three";

export const BALL_RADIUS = 1.65;
const average = (points) =>
  points
    .reduce((sum, p) => sum.add(p), new Vector3())
    .divideScalar(points.length);

function ordered(points) {
  const normal = average(points).normalize();
  const axis =
    Math.abs(normal.y) > 0.8 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0);
  const tangent = new Vector3().crossVectors(normal, axis).normalize();
  const bitangent = new Vector3().crossVectors(normal, tangent);
  return [...points].sort(
    (a, b) =>
      Math.atan2(a.dot(bitangent), a.dot(tangent)) -
      Math.atan2(b.dot(bitangent), b.dot(tangent)),
  );
}

// Truncate every directed edge at one third: 12 pentagons and 20 hexagons.
export function footballTopology() {
  const ico = new IcosahedronGeometry(1, 0);
  const positions = ico.getAttribute("position");
  const vertices = [];
  const triangles = [];
  const indices = new Map();
  for (let i = 0; i < positions.count; i += 3) {
    const triangle = [];
    for (let j = 0; j < 3; j++) {
      const point = new Vector3().fromBufferAttribute(positions, i + j);
      const key = point
        .toArray()
        .map((n) => n.toFixed(6))
        .join(",");
      if (!indices.has(key)) {
        indices.set(key, vertices.length);
        vertices.push(point);
      }
      triangle.push(indices.get(key));
    }
    triangles.push(triangle);
  }
  ico.dispose();
  const neighbours = vertices.map(() => new Set());
  for (const [a, b, c] of triangles) {
    neighbours[a].add(b).add(c);
    neighbours[b].add(a).add(c);
    neighbours[c].add(a).add(b);
  }
  const edge = (a, b) => vertices[a].clone().lerp(vertices[b], 1 / 3);
  const polygons = [
    ...vertices.map((_, a) => [...neighbours[a]].map((b) => edge(a, b))),
    ...triangles.map(([a, b, c]) => [
      edge(a, b),
      edge(b, a),
      edge(b, c),
      edge(c, b),
      edge(c, a),
      edge(a, c),
    ]),
  ];
  return polygons.map((points, index) => {
    const corners = ordered(points);
    const center = average(corners);
    return {
      index,
      kind: index < 12 ? "pentagon" : "hexagon",
      center,
      normal: center.clone().normalize(),
      corners: corners.map((p) => p.clone().lerp(center, 0.018)),
    };
  });
}

export function initialOrientation(faces) {
  const face = faces[12];
  const rotation = new Quaternion().setFromUnitVectors(
    face.normal,
    new Vector3(0, 0, 1),
  );
  const up = face.corners[0]
    .clone()
    .sub(face.center)
    .normalize()
    .applyQuaternion(rotation);
  rotation.premultiply(
    new Quaternion().setFromAxisAngle(
      new Vector3(0, 0, 1),
      Math.atan2(up.x, up.y),
    ),
  );
  rotation.premultiply(
    new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -0.08),
  );
  return rotation.premultiply(
    new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.1),
  );
}

export function panelOutline(face, steps = 12, radius = BALL_RADIUS - 0.002) {
  return face.corners.flatMap((a, i) =>
    Array.from({ length: steps }, (_, j) =>
      a
        .clone()
        .lerp(face.corners[(i + 1) % face.corners.length], j / steps)
        .normalize()
        .multiplyScalar(radius),
    ),
  );
}

export function panelGeometry(face, edgeSteps = 8) {
  const ringSize = face.corners.length * edgeSteps;
  const center = face.center.clone();
  const up = face.corners[0].clone().sub(center).normalize();
  const right = new Vector3().crossVectors(up, face.normal).normalize();
  const extent =
    Math.max(...face.corners.map((p) => p.distanceTo(center))) * 2.1;
  const positions = [],
    uv = [],
    indices = [];
  const add = (point, radius) => {
    const local = point.clone().sub(center);
    uv.push(0.5 + local.dot(right) / extent, 0.5 + local.dot(up) / extent);
    positions.push(
      ...point.clone().normalize().multiplyScalar(radius).toArray(),
    );
  };
  add(center, BALL_RADIUS);
  // Dense spherical rings keep the silhouette round; the last rings form the seam bevel.
  const rings = [
    0.09, 0.18, 0.27, 0.36, 0.45, 0.54, 0.63, 0.72, 0.81, 0.88, 0.93, 0.965,
    0.987, 1,
  ];
  for (const t of rings) {
    const bevel = Math.max(0, (t - 0.91) / 0.09);
    for (let i = 0; i < ringSize; i++) {
      const edgeIndex = Math.floor(i / edgeSteps);
      const p = face.corners[edgeIndex]
        .clone()
        .lerp(
          face.corners[(edgeIndex + 1) % face.corners.length],
          (i % edgeSteps) / edgeSteps,
        );
      add(center.clone().lerp(p, t), BALL_RADIUS - 0.009 * bevel * bevel);
    }
  }
  for (let i = 0; i < ringSize; i++)
    indices.push(0, 1 + i, 1 + ((i + 1) % ringSize));
  for (let ring = 0; ring < rings.length - 1; ring++) {
    for (let i = 0; i < ringSize; i++) {
      const a = 1 + ring * ringSize + i;
      const b = 1 + ring * ringSize + ((i + 1) % ringSize);
      const c = a + ringSize,
        d = b + ringSize;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
