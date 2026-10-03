import {
  ACESFilmicToneMapping,
  CanvasTexture,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  LineLoop,
  LineBasicMaterial,
  BufferGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  RepeatWrapping,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import {
  BALL_RADIUS,
  footballTopology,
  initialOrientation,
  panelGeometry,
  panelOutline,
} from "./geometry.mjs";

const areas = [
  {
    title: "Unsere Mannschaften",
    text: "Zusammen auf dem Platz.",
    link: "Teams entdecken",
    href: "mannschaften.html",
  },
  {
    title: "Aktuelles vom SVZ",
    text: "Nah dran am Vereinsleben.",
    link: "Zu den News",
    href: "news.html",
  },
  {
    title: "Unsere Jugend",
    text: "Hier spielt die Zukunft.",
    link: "Jugend entdecken",
    href: "jugend.html",
  },
  {
    title: "Dein Fanshop",
    text: "Schwarz-grün steht dir.",
    link: "Zum Fanshop",
    href: "fanshop.html",
  },
  {
    title: "Teil des Vereins",
    text: "Dein Platz ist bei uns.",
    link: "Mitglied werden",
    href: "mitgliedschaft.html",
  },
  {
    title: "Fans & Service",
    text: "Alles für deinen Besuch.",
    link: "Mehr erfahren",
    href: "service.html",
  },
];

function leatherTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const pixels = ctx.createImageData(256, 256);
  let seed = 1923;
  for (let i = 0; i < pixels.data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const value = 112 + (seed % 57);
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
    pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

export async function mountFootball(host) {
  const viewport = host.querySelector("[data-football-viewport]");
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  let context;
  try {
    context = canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    /* The static poster is the full fallback for unsupported devices. */
  }
  if (!context) throw new Error("WebGL2 unavailable");

  const renderer = new WebGLRenderer({
    canvas,
    context,
    alpha: true,
    antialias: true,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.1, 30);
  camera.position.set(0, 0.08, 6.7);
  const ball = new Group();
  scene.add(ball);
  scene.add(new HemisphereLight(0xf2fff8, 0x234d38, 1.5));
  for (const [color, intensity, position] of [
    [0xfff8ea, 3.4, [-3, 5, 5]],
    [0xdcecf1, 1.4, [4, 1, 3]],
    [0x48ed8c, 3.8, [2, 2, -4]],
    [0xffffff, 0.55, [-4, -2, 2]],
  ]) {
    const light = new DirectionalLight(color, intensity);
    light.position.set(...position);
    scene.add(light);
  }

  const resources = new Set();
  const own = (resource) => {
    resources.add(resource);
    return resource;
  };
  const bumpMap = own(leatherTexture());
  const white = own(
    new MeshPhysicalMaterial({
      color: 0xf3f1e6,
      roughness: 0.62,
      metalness: 0,
      clearcoat: 0.18,
      clearcoatRoughness: 0.55,
      bumpMap,
      bumpScale: 0.005,
    }),
  );
  const core = new Mesh(
    own(new SphereGeometry(BALL_RADIUS - 0.014, 64, 48)),
    own(new MeshStandardMaterial({ color: 0x15211b, roughness: 0.95 })),
  );
  ball.add(core);
  const faces = footballTopology();
  ball.quaternion.copy(initialOrientation(faces));
  const panels = [];
  const pentagons = [];
  for (const face of faces) {
    const material =
      face.kind === "pentagon"
        ? own(
            new MeshPhysicalMaterial({
              color: 0x101713,
              roughness: 0.66,
              metalness: 0,
              clearcoat: 0.22,
              clearcoatRoughness: 0.6,
              bumpMap,
              bumpScale: 0.005,
              emissive: 0x1e8c4b,
              emissiveIntensity: 0,
            }),
          )
        : white;
    const panel = new Mesh(own(panelGeometry(face)), material);
    panel.userData.face = face;
    ball.add(panel);
    panels.push(panel);
    if (face.kind === "pentagon") {
      const outline = new LineLoop(
        own(new BufferGeometry().setFromPoints(panelOutline(face))),
        own(
          new LineBasicMaterial({
            color: 0x55f190,
            transparent: true,
            opacity: 0.85,
          }),
        ),
      );
      outline.visible = false;
      ball.add(outline);
      panel.userData.area = face.index % areas.length;
      panel.userData.outline = outline;
      pentagons.push(panel);
    }
  }

  const controls = host.querySelector("[data-football-controls]");
  const motionButton = host.querySelector("[data-football-motion]");
  const hint = host.querySelector("[data-football-hint]");
  const status = host.querySelector("[data-football-status]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let automatic = !reducedMotion.matches;
  let activeArea = 0,
    hovered = null,
    target = null,
    pointer = null;
  let visible = true,
    disposed = false,
    failed = false;
  let frame = 0,
    lastTime = 0,
    elapsed = 0;
  const abort = new AbortController();
  const listen = (element, event, callback, options = {}) =>
    element.addEventListener(event, callback, {
      ...options,
      signal: abort.signal,
    });

  function updateMotion() {
    motionButton.setAttribute("aria-pressed", String(!automatic));
    motionButton.setAttribute(
      "aria-label",
      automatic ? "Drehung pausieren" : "Drehung starten",
    );
    motionButton.dataset.paused = String(!automatic);
    host.dataset.motion = automatic ? "running" : "paused";
  }

  function highlight() {
    for (const panel of pentagons) {
      const hover = panel === hovered;
      const selected = panel.userData.area === activeArea;
      panel.material.emissiveIntensity = hover ? 0.4 : selected ? 0.12 : 0;
      panel.userData.outline.visible = hover || selected;
      panel.userData.outline.material.opacity = hover ? 1 : 0.5;
    }
    viewport.style.cursor = pointer?.dragging
      ? "grabbing"
      : hovered
        ? "pointer"
        : "grab";
    invalidate();
  }

  function selectArea(index, panel) {
    activeArea = (index + areas.length) % areas.length;
    const area = areas[activeArea];
    host.querySelector("[data-football-number]").textContent =
      String(activeArea + 1).padStart(2, "0") + " / 06";
    host.querySelector("[data-football-title]").textContent = area.title;
    host.querySelector("[data-football-description]").textContent = area.text;
    const link = host.querySelector("[data-football-link]");
    link.href = area.href;
    link.querySelector("span").textContent = area.link;
    status.textContent = area.title + ". " + area.text;
    const candidates = pentagons.filter((p) => p.userData.area === activeArea);
    const depth = (p) =>
      p.userData.face.normal.clone().applyQuaternion(ball.quaternion).z;
    const selected = panel || candidates.sort((a, b) => depth(b) - depth(a))[0];
    target = new Quaternion().setFromUnitVectors(
      selected.userData.face.normal,
      new Vector3(0, 0.05, 1).normalize(),
    );
    automatic = false;
    if (reducedMotion.matches) {
      ball.quaternion.copy(target);
      target = null;
    }
    host.dataset.area = String(activeArea);
    updateMotion();
    highlight();
  }

  function invalidate() {
    if (!frame && visible && !document.hidden && !disposed && !failed)
      frame = requestAnimationFrame(render);
  }

  function render(time) {
    frame = 0;
    if (!visible || document.hidden || disposed || failed) {
      lastTime = 0;
      return;
    }
    const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
    lastTime = time;
    if (automatic && !pointer && !hovered) {
      elapsed += delta;
      ball.rotateY(delta * 0.13);
      ball.position.y = Math.sin(elapsed * 0.9) * 0.045;
    }
    if (target) {
      ball.quaternion.slerp(target, 1 - Math.exp(-delta * 7));
      if (ball.quaternion.angleTo(target) < 0.002) {
        ball.quaternion.copy(target);
        target = null;
      }
    }
    renderer.render(scene, camera);
    if ((automatic && !pointer && !hovered) || target) invalidate();
    else lastTime = 0;
  }

  function resize() {
    const { width, height } = viewport.getBoundingClientRect();
    if (!width || !height || disposed || failed) return;
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, width < 500 ? 1.5 : 1.75),
    );
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = camera.aspect < 0.95 ? 6.7 / camera.aspect : 6.7;
    camera.updateProjectionMatrix();
    invalidate();
  }

  const raycaster = new Raycaster();
  const point = new Vector2();
  function hit(event) {
    const rect = canvas.getBoundingClientRect();
    point.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    ball.updateMatrixWorld();
    camera.updateMatrixWorld();
    raycaster.setFromCamera(point, camera);
    // Raycast all panels, so a rear pentagon cannot be selected through a white face.
    const mesh = raycaster.intersectObjects(panels, false)[0]?.object;
    return mesh?.userData.face.kind === "pentagon" ? mesh : null;
  }

  listen(canvas, "pointerdown", (event) => {
    if (
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return;
    pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    };
    canvas.setPointerCapture(event.pointerId);
  });
  listen(canvas, "pointermove", (event) => {
    if (pointer && pointer.id === event.pointerId) {
      const distance = Math.hypot(
        event.clientX - pointer.startX,
        event.clientY - pointer.startY,
      );
      if (distance > 6) {
        pointer.dragging = true;
        automatic = false;
        target = null;
        const yaw = new Quaternion().setFromAxisAngle(
          new Vector3(0, 1, 0),
          (event.clientX - pointer.x) * 0.007,
        );
        ball.quaternion.premultiply(yaw);
        if (event.pointerType === "mouse") {
          const pitch = new Quaternion().setFromAxisAngle(
            new Vector3(1, 0, 0),
            (event.clientY - pointer.y) * 0.007,
          );
          ball.quaternion.premultiply(pitch);
        }
        hovered = null;
        updateMotion();
        highlight();
      }
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    } else if (event.pointerType === "mouse") {
      const panel = hit(event);
      if (panel !== hovered) {
        hovered = panel;
        highlight();
      }
    }
  });
  function release(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const clicked = event.type === "pointerup" && !pointer.dragging;
    pointer = null;
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
    if (clicked) {
      const panel = hit(event);
      if (panel) selectArea(panel.userData.area, panel);
    }
    highlight();
  }
  listen(canvas, "pointerup", release);
  listen(canvas, "pointercancel", release);
  listen(canvas, "lostpointercapture", release);
  listen(canvas, "pointerleave", () => {
    hovered = null;
    highlight();
  });
  listen(host.querySelector("[data-football-previous]"), "click", () =>
    selectArea(activeArea - 1),
  );
  listen(host.querySelector("[data-football-next]"), "click", () =>
    selectArea(activeArea + 1),
  );
  listen(motionButton, "click", () => {
    automatic = !automatic;
    target = null;
    updateMotion();
    invalidate();
  });
  listen(reducedMotion, "change", () => {
    if (reducedMotion.matches) {
      automatic = false;
      if (target) ball.quaternion.copy(target);
      target = null;
      updateMotion();
      invalidate();
    }
  });
  listen(host, "focusout", invalidate);
  listen(document, "visibilitychange", () => {
    lastTime = 0;
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else invalidate();
  });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(viewport);
  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      lastTime = 0;
      if (!visible) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else invalidate();
    },
    { threshold: 0.01 },
  );
  visibilityObserver.observe(viewport);

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    abort.abort();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    for (const resource of resources) resource.dispose();
    renderer.dispose();
  }
  listen(window, "pagehide", (event) => {
    if (!event.persisted) dispose();
  });
  listen(window, "pageshow", invalidate);
  listen(canvas, "webglcontextlost", (event) => {
    event.preventDefault();
    failed = true;
    host.dataset.state = "fallback";
    controls.hidden = true;
    hint.textContent = "Ein Ball. Ein Verein. Seit 1923.";
    dispose();
  });

  // The real club crest is a local texture on one curved white panel, not an overlay.
  const branding = document.createElement("canvas");
  branding.width = branding.height = 512;
  const paint = branding.getContext("2d");
  paint.fillStyle = "#f3f1e6";
  paint.fillRect(0, 0, 512, 512);
  const crest = new Image();
  // Bundled modules live in assets/football; resolve image paths relative to that directory.
  crest.src = new URL("../svzweckel_logo.jpg", import.meta.url).href;
  crest
    .decode()
    .then(() => {
      if (disposed) return;
      paint.save();
      paint.beginPath();
      paint.arc(256, 254, 126, 0, Math.PI * 2);
      paint.clip();
      paint.drawImage(crest, 130, 128, 252, 252);
      paint.restore();
      const map = own(new CanvasTexture(branding));
      map.colorSpace = SRGBColorSpace;
      map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      const branded = own(white.clone());
      branded.color = new Color(0xffffff);
      branded.map = map;
      panels[12].material = branded;
      invalidate();
    })
    .catch(() => {
      /* A failed decorative texture never disables the model. */
    });

  viewport.append(canvas);
  resize();
  renderer.render(scene, camera);
  host.dataset.state = "ready";
  host.dataset.area = "0";
  controls.hidden = false;
  hint.textContent = "Ziehen zum Drehen. Schwarze Flächen entdecken.";
  updateMotion();
  highlight();
}
