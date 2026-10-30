import * as THREE from 'three';

/**
 * Creates a procedural grid texture using 2D canvas.
 * Sets sRGB color space and repeats smoothly.
 */
export function createNeonRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#06060c';
    ctx.fillRect(0, 0, 512, 512);

    // Neon grid lines
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(170, 0);
    ctx.lineTo(170, 512);
    ctx.moveTo(342, 0);
    ctx.lineTo(342, 512);
    ctx.stroke();

    // Road dashed center markers
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 6;
    ctx.setLineDash([32, 32]);
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 512);
    ctx.stroke();

    // Outer road edges
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 8;
    ctx.setLineDash([]);
    ctx.strokeRect(4, 0, 504, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates a 3-12 part composite procedural Hero Cybercraft (THREE.Group).
 * Includes:
 * 1. Aerodynamic main fuselage / hull
 * 2. Tinted glass canopy / cockpit
 * 3. Left wing & engine pod
 * 4. Right wing & engine pod
 * 5. Left aerodynamic stabilizer fin
 * 6. Right aerodynamic stabilizer fin
 * 7. Twin plasma exhaust glow nozzles
 * 8. Underbody anti-gravity ring
 * 9. Ground contact shadow disc
 */
export function createHeroCraft(skin: 'neon' | 'gold' | 'emerald' | 'vaporwave' = 'neon'): THREE.Group {
  const craft = new THREE.Group();

  const skinColors = {
    neon: { hull: 0x1e1b4b, canopy: 0x38bdf8, emissive: 0x0284c7, fin: 0x4338ca, exhaust: 0xf43f5e, ring: 0x38bdf8 },
    gold: { hull: 0x18181b, canopy: 0xfbbf24, emissive: 0xd97706, fin: 0xca8a04, exhaust: 0xf59e0b, ring: 0xfde047 },
    emerald: { hull: 0x064e3b, canopy: 0x34d399, emissive: 0x059669, fin: 0x047857, exhaust: 0x10b981, ring: 0x6ee7b7 },
    vaporwave: { hull: 0x4a044e, canopy: 0xf472b6, emissive: 0xdb2777, fin: 0xa21caf, exhaust: 0x06b6d4, ring: 0xc084fc },
  }[skin];

  // 1. Primary Silhouette: Fuselage / Hull (Faceted aerodynamic wedge)
  const hullShape = new THREE.Shape();
  hullShape.moveTo(0, 1.8);
  hullShape.lineTo(0.9, -0.8);
  hullShape.lineTo(0.4, -1.6);
  hullShape.lineTo(-0.4, -1.6);
  hullShape.lineTo(-0.9, -0.8);
  hullShape.closePath();

  const extrudeSettings = {
    depth: 0.45,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.12,
    bevelThickness: 0.15,
  };
  const hullGeom = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
  hullGeom.center();

  const hullMat = new THREE.MeshStandardMaterial({
    color: skinColors.hull,
    metalness: 0.85,
    roughness: 0.25,
  });
  const hullMesh = new THREE.Mesh(hullGeom, hullMat);
  hullMesh.rotation.x = Math.PI / 2;
  hullMesh.position.y = 0.65;
  hullMesh.castShadow = true;
  craft.add(hullMesh);

  // 2. Cockpit Canopy (Glossy tinted glass)
  const canopyGeom = new THREE.CylinderGeometry(0.25, 0.4, 1.2, 16);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: skinColors.canopy,
    emissive: skinColors.emissive,
    emissiveIntensity: 0.35,
    metalness: 0.95,
    roughness: 0.12,
    transparent: true,
    opacity: 0.85,
  });
  const canopyMesh = new THREE.Mesh(canopyGeom, canopyMat);
  canopyMesh.rotation.x = Math.PI / 2;
  canopyMesh.position.set(0, 0.9, 0.2);
  craft.add(canopyMesh);

  // 3 & 4. Left & Right Thruster Engine Pods
  const engineGeom = new THREE.CylinderGeometry(0.2, 0.28, 1.4, 12);
  const engineMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.35,
  });

  const leftEngine = new THREE.Mesh(engineGeom, engineMat);
  leftEngine.rotation.x = Math.PI / 2;
  leftEngine.position.set(-1.1, 0.6, -0.6);
  craft.add(leftEngine);

  const rightEngine = new THREE.Mesh(engineGeom, engineMat);
  rightEngine.rotation.x = Math.PI / 2;
  rightEngine.position.set(1.1, 0.6, -0.6);
  craft.add(rightEngine);

  // 5 & 6. Left & Right Stabilizer Wing Fins
  const finGeom = new THREE.BoxGeometry(0.6, 0.08, 0.9);
  const finMat = new THREE.MeshStandardMaterial({
    color: skinColors.fin,
    metalness: 0.7,
    roughness: 0.4,
  });

  const leftFin = new THREE.Mesh(finGeom, finMat);
  leftFin.rotation.z = 0.25;
  leftFin.position.set(-1.5, 0.7, -0.6);
  craft.add(leftFin);

  const rightFin = new THREE.Mesh(finGeom, finMat);
  rightFin.rotation.z = -0.25;
  rightFin.position.set(1.5, 0.7, -0.6);
  craft.add(rightFin);

  // 7. Twin Plasma Exhaust Nozzles (Emissive glowing cones)
  const nozzleGeom = new THREE.ConeGeometry(0.18, 0.45, 12);
  const nozzleMat = new THREE.MeshBasicMaterial({
    color: skinColors.exhaust,
  });

  const leftExhaust = new THREE.Mesh(nozzleGeom, nozzleMat);
  leftExhaust.rotation.x = -Math.PI / 2;
  leftExhaust.position.set(-1.1, 0.6, -1.4);
  craft.add(leftExhaust);

  const rightExhaust = new THREE.Mesh(nozzleGeom, nozzleMat);
  rightExhaust.rotation.x = -Math.PI / 2;
  rightExhaust.position.set(1.1, 0.6, -1.4);
  craft.add(rightExhaust);

  // 8. Underbody Anti-Gravity Core Ring (Glowing cyan torus)
  const antiGravGeom = new THREE.TorusGeometry(0.4, 0.06, 8, 24);
  const antiGravMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const antiGravMesh = new THREE.Mesh(antiGravGeom, antiGravMat);
  antiGravMesh.rotation.x = Math.PI / 2;
  antiGravMesh.position.set(0, 0.35, 0);
  craft.add(antiGravMesh);

  // 9. Soft Ground Radial Contact Shadow Disc (grounding directive)
  const shadowGeom = new THREE.CircleGeometry(1.8, 24);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  craft.add(shadowMesh);

  return craft;
}

/**
 * Composite procedural Hazard: EMP Glitch Monolith (4 parts)
 */
export function createGlitchMonolith(): THREE.Group {
  const group = new THREE.Group();

  // 1. Dark obsidian core pillar
  const pillarGeom = new THREE.BoxGeometry(2.4, 3.8, 1.2);
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.9,
    roughness: 0.2,
  });
  const pillar = new THREE.Mesh(pillarGeom, pillarMat);
  pillar.position.y = 1.9;
  pillar.castShadow = true;
  group.add(pillar);

  // 2. Glowing glitch warning band
  const bandGeom = new THREE.BoxGeometry(2.5, 0.5, 1.3);
  const bandMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const band = new THREE.Mesh(bandGeom, bandMat);
  band.position.y = 2.4;
  group.add(band);

  // 3. Floating top antenna / prism
  const topGeom = new THREE.ConeGeometry(0.6, 1.0, 4);
  const topMat = new THREE.MeshStandardMaterial({
    color: 0x3f3f46,
    metalness: 0.8,
    roughness: 0.3,
  });
  const top = new THREE.Mesh(topGeom, topMat);
  top.position.y = 4.3;
  top.rotation.y = Math.PI / 4;
  group.add(top);

  // 4. Contact shadow disc
  const shadowGeom = new THREE.CircleGeometry(1.6, 16);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeom, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  return group;
}

/**
 * Composite procedural Hazard: Laser Gate (5 parts)
 */
export function createLaserGate(): THREE.Group {
  const group = new THREE.Group();

  const pylonGeom = new THREE.CylinderGeometry(0.35, 0.5, 3.6, 12);
  const pylonMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    metalness: 0.85,
    roughness: 0.35,
  });

  // 1 & 2. Left and Right Pylons
  const leftPylon = new THREE.Mesh(pylonGeom, pylonMat);
  leftPylon.position.set(-1.6, 1.8, 0);
  group.add(leftPylon);

  const rightPylon = new THREE.Mesh(pylonGeom, pylonMat);
  rightPylon.position.set(1.6, 1.8, 0);
  group.add(rightPylon);

  // 3. High-energy laser beam
  const beamGeom = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
  const beam = new THREE.Mesh(beamGeom, beamMat);
  beam.rotation.z = Math.PI / 2;
  beam.position.set(0, 1.8, 0);
  group.add(beam);

  // 4 & 5. Pylon Warning Lights
  const lightGeom = new THREE.SphereGeometry(0.2, 8, 8);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

  const leftLight = new THREE.Mesh(lightGeom, lightMat);
  leftLight.position.set(-1.6, 3.7, 0);
  group.add(leftLight);

  const rightLight = new THREE.Mesh(lightGeom, lightMat);
  rightLight.position.set(1.6, 3.7, 0);
  group.add(rightLight);

  return group;
}

/**
 * Composite procedural Collectible: Vibe Crystal (3 parts)
 */
export function createVibeCrystal(type: 'neon' | 'stardust' | 'gold'): THREE.Group {
  const group = new THREE.Group();

  const color = type === 'gold' ? 0xfbbf24 : type === 'stardust' ? 0xc084fc : 0x38bdf8;

  // 1. Faceted Icosahedron Gem Core
  const gemGeom = new THREE.IcosahedronGeometry(0.65, 0);
  const gemMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.45,
    metalness: 0.9,
    roughness: 0.15,
  });
  const gem = new THREE.Mesh(gemGeom, gemMat);
  gem.position.y = 1.2;
  group.add(gem);

  // 2. Orbiting Resonance Ring
  const ringGeom = new THREE.TorusGeometry(0.9, 0.04, 6, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.rotation.x = Math.PI / 3;
  ring.position.y = 1.2;
  group.add(ring);

  // 3. Ground contact glow
  const glowGeom = new THREE.CircleGeometry(0.8, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeom, glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.02;
  group.add(glow);

  return group;
}
