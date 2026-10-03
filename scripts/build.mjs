import { build } from "esbuild";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Vector3 } from "three";
import {
  footballTopology,
  initialOrientation,
  panelOutline,
  BALL_RADIUS,
} from "../src/football/geometry.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const outdir = root + "assets/football";
await mkdir(outdir, { recursive: true });
// Only remove previous generated modules, never source assets.
for (const file of await readdir(outdir)) {
  if (file.endsWith(".js") || file.endsWith(".js.LEGAL.txt"))
    await rm(outdir + "/" + file);
}
await build({
  entryPoints: { football: root + "src/football/entry.mjs" },
  outdir,
  bundle: true,
  splitting: true,
  format: "esm",
  target: ["es2020"],
  minify: true,
  legalComments: "external",
  logLevel: "info",
});
await writeFile(
  outdir + "/THREE-LICENSE.txt",
  await readFile(root + "node_modules/three/LICENSE"),
);

// Project the same panel topology for a zero-JavaScript, zero-WebGL fallback.
const faces = footballTopology();
const orientation = initialOrientation(faces);
const light = new Vector3(-0.5, 0.8, 1).normalize();
const polygons = faces
  .map((face) => {
    const normal = face.normal.clone().applyQuaternion(orientation);
    const points = panelOutline(face, 16).map((point) =>
      point.applyQuaternion(orientation),
    );
    const shade = Math.round(
      (face.kind === "pentagon" ? 18 : 191) +
        (normal.dot(light) + 1) * (face.kind === "pentagon" ? 8 : 30),
    );
    return {
      depth: normal.z,
      svg: `<path d="${points.map((p, i) => `${i ? "L" : "M"}${(300 + (p.x / BALL_RADIUS) * 219).toFixed(2)},${(254 - (p.y / BALL_RADIUS) * 219).toFixed(2)}`).join(" ")}Z" fill="rgb(${shade},${shade + 2},${shade})" stroke="#19241e" stroke-width="1.4" stroke-linejoin="round"/>`,
    };
  })
  .sort((a, b) => a.depth - b.depth);
await writeFile(
  outdir + "/football-poster.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 530">
<defs><radialGradient id="shade" cx="32%" cy="24%" r="80%"><stop stop-color="#fff" stop-opacity=".16"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#001c10" stop-opacity=".8"/></radialGradient><radialGradient id="shadow"><stop stop-color="#000" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient><clipPath id="ball"><circle cx="300" cy="254" r="219"/></clipPath></defs>
<ellipse cx="300" cy="500" rx="155" ry="22" fill="url(#shadow)"/>
<g clip-path="url(#ball)"><circle cx="300" cy="254" r="219" fill="#18251d"/>${polygons.map((p) => p.svg).join("")}<circle cx="300" cy="254" r="219" fill="url(#shade)"/></g></svg>`,
);
