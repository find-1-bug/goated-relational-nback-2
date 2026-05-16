import * as THREE from 'three';
import { renderRelationship, is3D } from './relationshipRenderer';

// 3D shapes using Three.js
const SHAPES_3D = ['cube', 'sphere', 'pyramid', 'cone', 'torus', 'octahedron'];

function createShape3D(shapeType, size, color) {
  let geometry;
  switch (shapeType) {
    case 'cube':
      geometry = new THREE.BoxGeometry(size, size, size);
      break;
    case 'sphere':
      geometry = new THREE.SphereGeometry(size / 2, 16, 12);
      break;
    case 'pyramid':
      geometry = new THREE.TetrahedronGeometry(size);
      break;
    case 'cone':
      geometry = new THREE.ConeGeometry(size / 2, size, 16);
      break;
    case 'torus':
      geometry = new THREE.TorusGeometry(size / 2, size / 4, 8, 32);
      break;
    case 'octahedron':
      geometry = new THREE.OctahedronGeometry(size);
      break;
    default:
      geometry = new THREE.BoxGeometry(size, size, size);
  }
  const material = new THREE.MeshStandardMaterial({ 
    color, 
    metalness: 0.2, 
    roughness: 0.5,
    side: THREE.FrontSide
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

// Position two meshes per a SPATIAL_3D relationship's semantics. Shared by
// the standalone 3D renderer and the offscreen still-render used inside
// alien-cube / square / tesseract panels.
function applySpatial3DPositioning(relationship, mesh1, mesh2) {
  switch (relationship) {
    case 'DEPTH_LAYERED':       mesh1.position.z = -2; mesh2.position.z = 2; break;
    case 'ORBITING':            mesh1.position.set(0, 0, 0); mesh2.position.set(3, 0, 0); break;
    case 'ROTATING_PAIR':       mesh1.position.set(-2, 0, 0); mesh2.position.set(2, 0, 0); break;
    case 'NESTED_VOLUME':       mesh1.position.set(0, 0, 0); mesh2.position.set(0, 0, 0); mesh2.scale.set(0.5, 0.5, 0.5); break;
    case 'ASCENDING_SPIRAL':    mesh1.position.set(0, -2, 0); mesh2.position.set(2, 2, 0); break;
    case 'COLLIDING':           mesh1.position.set(-1.5, 0, 0); mesh2.position.set(1.5, 0, 0); break;
    case 'REPELLING':           mesh1.position.set(-3, 0, 0); mesh2.position.set(3, 0, 0); break;
    case 'BOUND_BY_GRAVITY':    mesh1.position.set(0, 0, 0); mesh2.position.set(0, -3, 0); break;
    case 'INTERSECTING_PLANES': mesh1.position.set(-1, 0, 0); mesh2.position.set(1, 0, 0); mesh2.rotation.z = Math.PI / 4; break;
    case 'IN_FRONT_OF':         mesh1.position.z = 2; mesh2.position.z = -1; break;
    case 'BEHIND':              mesh1.position.z = -2; mesh2.position.z = 1; break;
    case 'STACKED_3D':          mesh1.position.set(0, 0.8, 0); mesh2.position.set(0, -0.8, 0); break;
    case 'LEANING_AGAINST':     mesh1.position.set(-1.5, 0, 0); mesh1.rotation.z = 0.3; mesh2.position.set(1.5, 0, 0); break;
    case 'FLOATING_ABOVE':      mesh1.position.set(0, 2, 0); mesh2.position.set(0, -1, 0); break;
    case 'CASTING_SHADOW':      mesh1.position.set(-1, 1.5, 1); mesh2.position.set(-1, -1.5, -2); break;
  }
}

// Singleton offscreen renderer for one-shot 3D snapshots used as 2D
// textures inside the alien panels. Reusing a single GL context avoids
// hitting the browser's per-page WebGL context cap (typically ~16) when
// trials fire in rapid succession.
let _stillRenderer = null;
let _stillRendererSize = { w: 0, h: 0 };
function getStillRenderer(width, height) {
  if (!_stillRenderer) {
    const canvas = document.createElement('canvas');
    _stillRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    _stillRenderer.setPixelRatio(1);
  }
  if (_stillRendererSize.w !== width || _stillRendererSize.h !== height) {
    _stillRenderer.setSize(width, height, false);
    _stillRendererSize = { w: width, h: height };
  }
  return _stillRenderer;
}

// Animated 3D-snapshot controller. Returns { canvas, update, dispose }.
// `canvas` is a 2D canvas the caller can drawImage from. Each update() call
// rotates the meshes by elapsed time, applies any relation-specific motion
// (ORBITING, ROTATING_PAIR), renders the scene through the singleton
// renderer, and copies the freshly-rendered pixels into the snapshot canvas.
//
// Multiple snapshot instances coexist by sharing the singleton renderer
// sequentially — each update() resets the renderer's size, renders its own
// scene, then immediately copies the pixels out, so callers never read each
// other's output. This keeps total WebGL context usage to 1 regardless of
// how many alien streams are on screen.
export function createSpatial3DSnapshot(width, height, relationship, stimulus, colors) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080d16);

  // Camera pulled back to z=14 with FOV 45 so even the widest SPATIAL_3D
  // arrangements (REPELLING ±3, BOUND_BY_GRAVITY y=-3, ORBITING radius 4)
  // sit comfortably inside the frustum and aren't clipped by the panel.
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 1, 14);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const directional = new THREE.DirectionalLight(0xffffff, 1);
  directional.position.set(8, 10, 8);
  scene.add(directional);

  const toColor = c => typeof c === 'string' && c.startsWith('#') ? parseInt(c.slice(1), 16) : c;
  const shape1 = stimulus?.shape3DA || SHAPES_3D[0];
  const shape2 = stimulus?.shape3DB || SHAPES_3D[1];
  const size1 = stimulus?.size3DA || 2.5;
  const size2 = stimulus?.size3DB || 2.5;
  const mesh1 = createShape3D(shape1, size1, toColor((colors && colors[0]) || stimulus?.colorA || '#22d3ee'));
  const mesh2 = createShape3D(shape2, size2, toColor((colors && colors[1]) || stimulus?.colorB || '#a78bfa'));
  applySpatial3DPositioning(relationship, mesh1, mesh2);
  scene.add(mesh1);
  scene.add(mesh2);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  let elapsed = 0;
  let lastT = performance.now();

  function update() {
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;
    elapsed += dt;

    // Spin both meshes so the player sees them as 3D, not flat.
    mesh1.rotation.x += dt * 0.55;
    mesh1.rotation.y += dt * 0.75;
    mesh2.rotation.x += dt * 0.50;
    mesh2.rotation.y += dt * 0.65;

    // Relation-specific motion (mirrors the standalone 3D renderer so the
    // semantics of ORBITING / ROTATING_PAIR are still legible inside the
    // alien panels).
    if (relationship === 'ORBITING') {
      const a = elapsed * 0.6;
      mesh2.position.x = Math.cos(a) * 4;
      mesh2.position.z = Math.sin(a) * 3;
    } else if (relationship === 'ROTATING_PAIR') {
      const a = elapsed * 0.6;
      mesh1.position.x = Math.cos(a) * 2.5;
      mesh2.position.x = -Math.cos(a) * 2.5;
    } else if (relationship === 'ASCENDING_SPIRAL') {
      mesh1.position.y = -2 + Math.sin(elapsed * 1.0) * 0.4;
      mesh2.position.y = 2 + Math.sin(elapsed * 1.0 + Math.PI) * 0.4;
    } else if (relationship === 'FLOATING_ABOVE') {
      mesh1.position.y = 2 + Math.sin(elapsed * 1.6) * 0.25;
    }

    const renderer = getStillRenderer(width, height);
    renderer.render(scene, camera);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(renderer.domElement, 0, 0, width, height);
  }

  function dispose() {
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) object.material.forEach(m => m.dispose());
        else object.material.dispose();
      }
    });
  }

  // Prime the canvas so callers can draw it immediately.
  update();

  return { canvas, update, dispose };
}

function createRelationPanelTexture(relationship, stimulus, alienCubeScale = 1) {
  const panelCanvas = document.createElement('canvas');
  panelCanvas.width = 900;
  panelCanvas.height = 560;
  const ctx = panelCanvas.getContext('2d');

  const contentCanvas = document.createElement('canvas');
  contentCanvas.width = 900;
  contentCanvas.height = 560;
  const contentCtx = contentCanvas.getContext('2d');

  const snapshot = is3D(relationship)
    ? createSpatial3DSnapshot(contentCanvas.width, contentCanvas.height, relationship, stimulus, [stimulus?.colorA, stimulus?.colorB])
    : null;
  const contentScale = Math.min(1.28, 1 + Math.max(0, alienCubeScale - 1) * 0.75);
  const zoom = Math.min(1.32, 1.08 * alienCubeScale);
  const scaledW = panelCanvas.width * zoom;
  const scaledH = panelCanvas.height * zoom;

  function refresh() {
    // Refresh content area first (snapshot tick OR 2D re-render)
    contentCtx.clearRect(0, 0, contentCanvas.width, contentCanvas.height);
    if (snapshot) {
      contentCtx.drawImage(snapshot.canvas, 0, 0);
    } else {
      renderRelationship(contentCtx, contentCanvas.width, contentCanvas.height, relationship, null, {
        ...stimulus,
        renderScale: contentScale,
      });
    }

    // Re-composite the panel: background fill, border, scaled content.
    ctx.clearRect(0, 0, panelCanvas.width, panelCanvas.height);
    ctx.fillStyle = 'rgba(8, 13, 22, 0.92)';
    ctx.fillRect(0, 0, panelCanvas.width, panelCanvas.height);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(18, 18, panelCanvas.width - 36, panelCanvas.height - 36, 22);
    ctx.stroke();
    ctx.drawImage(
      contentCanvas,
      (panelCanvas.width - scaledW) / 2,
      (panelCanvas.height - scaledH) / 2,
      scaledW,
      scaledH
    );
  }

  // Prime once so the texture's first paint is non-empty.
  refresh();

  const texture = new THREE.CanvasTexture(panelCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return { texture, snapshot, refresh };
}

function setupScene(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617);

  const starGeometry = new THREE.BufferGeometry();
  const starPositions = [];
  for (let i = 0; i < 120; i++) {
    starPositions.push((Math.random() - 0.5) * 28, (Math.random() - 0.5) * 18, -Math.random() * 24);
  }
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.035, transparent: true, opacity: 0.65 });
  scene.add(new THREE.Points(starGeometry, starMaterial));

  const camera = new THREE.PerspectiveCamera(72, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.set(0, 0.85, 3.15);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.shadowMap.enabled = false;

  // Lighting
  const light1 = new THREE.DirectionalLight(0xffffff, 1);
  light1.position.set(8, 10, 8);
  light1.castShadow = false;
  scene.add(light1);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);


  return { scene, camera, renderer };
}

export function render3DRelationship(canvas, relationship, colors, rintChain = null, stimulus = null, options = {}) {
  const streamCount = options.streamCount || 1;
  const alienSettings = options.alienSettings || stimulus?.alienSettings || {};
  const cubeDirection = alienSettings.cubeDirection === 'ccw' ? -1 : 1;
  const cubeSpeed = Number(alienSettings.cubeSpeed || 1);
  const streamDepthOffset = Math.max(0, streamCount - 1);
  const alienCubeScale = stimulus?.cubePosition || stimulus?.tesseractPosition ? Math.min(1.36, 1.12 + streamDepthOffset * 0.04) : 1;
  const { scene, camera, renderer } = setupScene(canvas);
  if (stimulus?.cubePosition || stimulus?.tesseractPosition) {
    camera.position.z = Math.min(4.85, 3.65 + streamDepthOffset * 0.14);
    camera.lookAt(0, 0, 0);
  } else if (!rintChain || rintChain.length === 0) {
    // Non-alien SPATIAL_3D meshes are placed at z = ±2-3 with size ~2-3.5;
    // the default camera at z=3.15 puts them ~1 unit from the lens. Pull
    // back and widen FOV slightly so even the broadest arrangements
    // (REPELLING ±3 with shapes up to size 3.5) fit comfortably.
    camera.position.set(0, 1.0, 12);
    camera.fov = 50;
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
  }

  const toThreeColor = (c) => {
    if (typeof c === 'number') return c;
    if (typeof c === 'string' && c.startsWith('#')) return parseInt(c.slice(1), 16);
    return 0xffffff;
  };

  let meshes = [];
  // Collected panel snapshot+texture controllers so the animate loop can
  // tick them each frame (and the cleanup can dispose them).
  const panelInfos = [];

  if (stimulus?.tesseractPosition) {
    const tesseractGroup = new THREE.Group();
    scene.add(tesseractGroup);

    const p = stimulus.tesseractPosition;
    const tesseractDirection = alienSettings.tesseractDirection === 'ccw' ? -1 : 1;
    const tesseractSpeed = Number(alienSettings.tesseractSpeed || cubeSpeed || 1);
    const targetX = p.y > 0 ? -0.42 : p.y < 0 ? 0.42 : 0;
    const targetY = p.x > 0 ? -0.52 : p.x < 0 ? 0.52 : 0;
    tesseractGroup.rotation.set(targetX * 0.72, targetY * 0.72, (Math.random() - 0.5) * 0.2);
    tesseractGroup.userData.rotationSpeed = {
      x: tesseractDirection * tesseractSpeed * (targetX || 0.2) / 95,
      y: tesseractDirection * tesseractSpeed * (targetY || 0.25) / 95,
      z: tesseractDirection * tesseractSpeed * 0.0025,
    };

    const outerSize = 3;
    const innerSize = 1.85;
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x9aa8ff, transparent: true, opacity: 0.2 });
    const innerMaterial = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.34 });
    const connectorMaterial = new THREE.LineBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.3 });

    const outerEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(outerSize, outerSize, outerSize)), gridMaterial);
    const innerEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(innerSize, innerSize, innerSize)), innerMaterial);
    tesseractGroup.add(outerEdges);
    tesseractGroup.add(innerEdges);

    [-1, 1].forEach(x => [-1, 1].forEach(y => [-1, 1].forEach(z => {
      const a = new THREE.Vector3(x * outerSize / 2, y * outerSize / 2, z * outerSize / 2);
      const b = new THREE.Vector3(x * innerSize / 2, y * innerSize / 2, z * innerSize / 2);
      const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
      tesseractGroup.add(new THREE.Line(geometry, connectorMaterial));
    })));

    const layerScale = p.w < 0 ? 1 : p.w > 0 ? innerSize / outerSize : 0.72;
    const activeCellEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.86, 0.86, 0.86)),
      new THREE.LineBasicMaterial({ color: toThreeColor(colors[0]), transparent: true, opacity: 0.98 })
    );
    activeCellEdges.scale.setScalar(layerScale);
    activeCellEdges.position.set(p.x * layerScale, p.y * layerScale, p.z * layerScale);
    tesseractGroup.add(activeCellEdges);

    const isCompactView = canvas.clientWidth < 420 || canvas.clientHeight < 320;
    const panelWidth = (isCompactView ? 2.0 : 2.5) * alienCubeScale;
    const panelHeight = (isCompactView ? 1.25 : 1.55) * alienCubeScale;
    const panelInfo = createRelationPanelTexture(relationship, stimulus, alienCubeScale);
    panelInfos.push(panelInfo);
    const relPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(panelWidth, panelHeight),
      new THREE.MeshBasicMaterial({ map: panelInfo.texture, transparent: false, side: THREE.DoubleSide })
    );
    relPanel.position.set(
      THREE.MathUtils.clamp(p.x * 0.36, -0.42, 0.42),
      THREE.MathUtils.clamp(p.y * 0.36, -0.42, 0.42),
      0.46 + p.w * 0.12 + streamDepthOffset * 0.03
    );
    relPanel.lookAt(camera.position);

    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(panelWidth * 0.84, panelHeight * 0.82, 0.08),
      new THREE.MeshBasicMaterial({ color: toThreeColor(colors[0]), transparent: true, opacity: 0.16 })
    );
    glow.position.copy(relPanel.position);
    glow.lookAt(camera.position);
    tesseractGroup.add(glow);
    tesseractGroup.add(relPanel);

    const layerLabel = p.w < 0 ? 'OUTER W-' : p.w > 0 ? 'INNER W+' : 'MID W0';
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 96;
    const labelCtx = labelCanvas.getContext('2d');
    labelCtx.fillStyle = 'rgba(8,13,22,0.8)';
    labelCtx.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
    labelCtx.font = "bold 38px 'JetBrains Mono', monospace";
    labelCtx.textAlign = 'center';
    labelCtx.textBaseline = 'middle';
    labelCtx.fillStyle = '#22d3ee';
    labelCtx.fillText(layerLabel, labelCanvas.width / 2, labelCanvas.height / 2);
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    labelTexture.colorSpace = THREE.SRGBColorSpace;
    const labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 0.32),
      new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, side: THREE.DoubleSide })
    );
    labelMesh.position.set(0, -1.82, 0.65);
    labelMesh.lookAt(camera.position);
    tesseractGroup.add(labelMesh);

    meshes = [tesseractGroup, relPanel, labelMesh];
  } else if (stimulus?.cubePosition) {
    const cubeGroup = new THREE.Group();
    scene.add(cubeGroup);

    const p = stimulus.cubePosition;
    const targetX = p.y > 0 ? -0.45 : p.y < 0 ? 0.45 : 0;
    const targetY = p.x > 0 ? -0.58 : p.x < 0 ? 0.58 : 0;
    const startsReadable = Math.random() < 0.5;
    cubeGroup.rotation.set(
      startsReadable ? targetX : targetX * -0.65,
      startsReadable ? targetY : targetY * -0.65,
      (Math.random() - 0.5) * 0.28
    );
    cubeGroup.userData.rotationSpeed = {
      x: cubeDirection * cubeSpeed * (targetX || 0.22) / 90,
      y: cubeDirection * cubeSpeed * (targetY || 0.28) / 90,
      z: cubeDirection * cubeSpeed * 0.002,
    };

    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x9aa8ff, transparent: true, opacity: 0.22 });
    for (let i = -1.5; i <= 1.5; i += 1) {
      for (let j = -1.5; j <= 1.5; j += 1) {
        [[[-1.5, i, j], [1.5, i, j]], [[i, -1.5, j], [i, 1.5, j]], [[i, j, -1.5], [i, j, 1.5]]].forEach(([a, b]) => {
          const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
          cubeGroup.add(new THREE.Line(geometry, gridMaterial));
        });
      }
    }

    const shell = new THREE.Mesh(
      new THREE.BoxGeometry(3, 3, 3),
      new THREE.MeshBasicMaterial({ color: 0x6d7cff, transparent: true, opacity: 0.045, side: THREE.BackSide })
    );
    cubeGroup.add(shell);

    const axisConfigs = [
      { color: 0xff1744, points: [new THREE.Vector3(-1.5, 0, 0), new THREE.Vector3(0, 0, 0)] },
      { color: 0xffc400, points: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1.5, 0, 0)] },
      { color: 0x7c3aed, points: [new THREE.Vector3(0, -1.5, 0), new THREE.Vector3(0, 0, 0)] },
      { color: 0x39ff14, points: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.5, 0)] },
      { color: 0x0066ff, points: [new THREE.Vector3(0, 0, -1.5), new THREE.Vector3(0, 0, 0)] },
      { color: 0x00f5ff, points: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1.5)] },
    ];

    axisConfigs.forEach(({ color, points }) => {
      const axis = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 2, 0.022, 8, false),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92 })
      );
      cubeGroup.add(axis);
    });

    const activeCellEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      new THREE.LineBasicMaterial({ color: toThreeColor(colors[0]), transparent: true, opacity: 0.98 })
    );
    activeCellEdges.position.set(p.x, p.y, p.z);
    cubeGroup.add(activeCellEdges);

    const isCompactView = canvas.clientWidth < 420 || canvas.clientHeight < 320;
    const panelWidth = (isCompactView ? 2.1 : 2.65) * alienCubeScale;
    const panelHeight = (isCompactView ? 1.3 : 1.65) * alienCubeScale;
    const panelInfo = createRelationPanelTexture(relationship, stimulus, alienCubeScale);
    panelInfos.push(panelInfo);
    const relPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(panelWidth, panelHeight),
      new THREE.MeshBasicMaterial({ map: panelInfo.texture, transparent: false, side: THREE.DoubleSide })
    );
    const safePanelX = THREE.MathUtils.clamp(p.x * 0.48, -0.52, 0.52);
    const safePanelY = THREE.MathUtils.clamp(p.y * 0.48, -0.52, 0.52);
    const safePanelZ = THREE.MathUtils.clamp(p.z * 0.42, -0.42, 0.62);
    relPanel.position.set(safePanelX, safePanelY, safePanelZ + 0.24 + streamDepthOffset * 0.03);
    relPanel.lookAt(camera.position);

    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(panelWidth * 0.82, panelHeight * 0.81, 0.08),
      new THREE.MeshBasicMaterial({ color: toThreeColor(colors[0]), transparent: true, opacity: 0.18 })
    );
    glow.position.copy(relPanel.position);
    glow.lookAt(camera.position);
    cubeGroup.add(glow);
    cubeGroup.add(relPanel);
    meshes = [cubeGroup, relPanel];
  } else if (rintChain && rintChain.length > 0) {
    // RINT mode: show entity chain (A > B, B > C)
    const ENTITY_COLORS = {
      alpha: 0x22d3ee,  // cyan
      beta:  0xa78bfa,  // purple
      gamma: 0x34d399,  // emerald
    };
    
    const entities = ['alpha', 'beta', 'gamma'];
    const positions = [
      { x: -3.5, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      { x: 3.5, y: 0, z: 0 },
    ];

    entities.forEach((entity, idx) => {
      const mesh = createShape3D('sphere', 1.2, ENTITY_COLORS[entity]);
      mesh.position.set(positions[idx].x, positions[idx].y, positions[idx].z);
      scene.add(mesh);
      meshes.push(mesh);
    });

    // Draw relationship lines
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setFromPoints([
      new THREE.Vector3(-3.5, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(3.5, 0, 0),
    ]);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x64748b, linewidth: 2 });
    const lines = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(lines);
  } else {
    // Normal mode: use saved 3D attributes so preview/replay stays identical
    const shape1 = stimulus?.shape3DA || SHAPES_3D[0];
    const shape2 = stimulus?.shape3DB || SHAPES_3D[1];
    const size1 = stimulus?.size3DA || 2.5;
    const size2 = stimulus?.size3DB || 2.5;

    const mesh1 = createShape3D(shape1, size1, toThreeColor(colors[0]));
    const mesh2 = createShape3D(shape2, size2, toThreeColor(colors[1]));
    meshes = [mesh1, mesh2];
  }

  // Position based on relationship (only for normal 3D relationships)
  if (!stimulus?.cubePosition && !stimulus?.tesseractPosition && (!rintChain || rintChain.length === 0)) {
    const mesh1 = meshes[0];
    const mesh2 = meshes[1];
    applySpatial3DPositioning(relationship, mesh1, mesh2);
    scene.add(mesh1);
    scene.add(mesh2);
  }

  // Animation loop: keep rotating for the full trial duration
  let animationId;
  let lastPanelTick = 0;
  const animate = () => {
    animationId = requestAnimationFrame(animate);

    meshes.forEach((mesh, index) => {
      if ((stimulus?.cubePosition || stimulus?.tesseractPosition) && index > 0) return;
      const speed = mesh.userData?.rotationSpeed;
      mesh.rotation.x += speed?.x || 0.003;
      mesh.rotation.y += speed?.y || 0.005;
      mesh.rotation.z += speed?.z || 0;
    });

    if ((stimulus?.cubePosition || stimulus?.tesseractPosition) && meshes[1]) {
      meshes[1].lookAt(camera.position);
      if (meshes[2]) meshes[2].lookAt(camera.position);
    }

    if (!stimulus?.cubePosition && !stimulus?.tesseractPosition && (!rintChain || rintChain.length === 0)) {
      const mesh1 = meshes[0];
      const mesh2 = meshes[1];

      if (relationship === 'ORBITING') {
        const angle = performance.now() * 0.0005;
        mesh2.position.x = Math.cos(angle) * 4;
        mesh2.position.z = Math.sin(angle) * 3;
      } else if (relationship === 'ROTATING_PAIR') {
        const angle = performance.now() * 0.0005;
        mesh1.position.x = Math.cos(angle) * 2.5;
        mesh2.position.x = -Math.cos(angle) * 2.5;
      }
    }

    // Tick any animated SPATIAL_3D snapshots embedded in alien panels.
    // Throttled to ~30 fps so we don't double the GPU work per stream.
    const now = performance.now();
    if (now - lastPanelTick > 33 && panelInfos.length > 0) {
      lastPanelTick = now;
      for (const info of panelInfos) {
        if (info.snapshot) {
          info.snapshot.update();
          info.refresh();
          info.texture.needsUpdate = true;
        }
      }
    }

    renderer.render(scene, camera);
  };

  animate();

  // Cleanup function
  return () => {
    cancelAnimationFrame(animationId);
    panelInfos.forEach(info => info.snapshot?.dispose());
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
        else object.material.dispose();
      }
    });
    renderer.dispose();
  };
}