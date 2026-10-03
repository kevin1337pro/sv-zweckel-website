import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { Vector3 } from "three";
import {
  BALL_RADIUS,
  footballTopology,
  initialOrientation,
  panelGeometry,
} from "../src/football/geometry.mjs";

test("football has 12 pentagons and 20 hexagons arranged on a sphere", () => {
  const faces = footballTopology();
  assert.equal(faces.length, 32);
  assert.equal(faces.filter((f) => f.kind === "pentagon").length, 12);
  assert.equal(faces.filter((f) => f.kind === "hexagon").length, 20);
  assert.ok(
    faces[12].normal.clone().applyQuaternion(initialOrientation(faces)).z >
      0.98,
  );
  let triangles = 0;
  for (const face of faces) {
    assert.equal(face.corners.length, face.kind === "pentagon" ? 5 : 6);
    const geometry = panelGeometry(face);
    const position = geometry.getAttribute("position");
    const normal = geometry.getAttribute("normal");
    const index = geometry.getIndex();
    triangles += index.count / 3;
    for (let i = 0; i < position.count; i++) {
      const point = new Vector3().fromBufferAttribute(position, i);
      const direction = new Vector3().fromBufferAttribute(normal, i);
      assert.ok(point.length() >= BALL_RADIUS - 0.011);
      assert.ok(point.length() <= BALL_RADIUS + 0.00001);
      assert.ok(
        direction.dot(point.normalize()) > 0.9,
        "smooth outward normals",
      );
      assert.ok(Math.abs(direction.length() - 1) < 0.0001);
    }
    for (const vertex of index.array)
      assert.ok(vertex >= 0 && vertex < position.count);
    geometry.dispose();
  }
  assert.ok(
    triangles > 30000 && triangles < 60000,
    "bounded, rounded mesh complexity",
  );
});

test("only the homepage loads 3D; bundles, fallback and license stay local", () => {
  const root = new URL("../", import.meta.url);
  const read = (file) => readFileSync(new URL(file, root), "utf8");
  for (const page of readdirSync(root).filter((f) => f.endsWith(".html"))) {
    const html = read(page);
    assert.equal(
      html.includes('src="assets/football/football.js'),
      page === "index.html",
    );
  }
  const entry = read("assets/football/football.js");
  assert.match(entry, /import\(/);
  assert.ok(statSync(new URL("assets/football/football.js", root)).size < 3000);
  const scripts = readdirSync(new URL("assets/football/", root)).filter((f) =>
    f.endsWith(".js"),
  );
  assert.ok(scripts.length >= 2);
  for (const file of scripts)
    assert.ok(statSync(new URL("assets/football/" + file, root)).size < 650000);
  assert.match(read("assets/football/THREE-LICENSE.txt"), /MIT License/);
  assert.match(read("assets/football/football-poster.svg"), /<svg/);
  assert.match(read("styles.css"), /touch-action: pan-y pinch-zoom/);
  assert.match(read(".github/workflows/deploy-pages.yml"), /npm ci/);
  assert.match(
    read(".github/workflows/deploy-pages.yml"),
    /cp -R assets\/football/,
  );
});
