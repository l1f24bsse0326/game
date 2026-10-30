import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Pause,
  Sparkles,
  Flame,
  ArrowLeft,
  ArrowRight,
  Shield,
  Trophy,
  Smartphone,
  Wand2,
  Video,
} from 'lucide-react';
import {
  getLane3DX,
  checkSphereBoxCollision,
  dampExp,
  calculate3DScore,
  get3DRunSpeed,
  MAX_SHIELDS,
  THREE_LANES,
} from '../game/threeRules';
import {
  createHeroCraft,
  createGlitchMonolith,
  createLaserGate,
  createVibeCrystal,
  createNeonRoadTexture,
} from '../game/proceduralModels';
import { sound } from '../game/audio';

interface VibeGame3DProps {
  onBackToStudio: () => void;
  onSendToStudio: (vibePrompt: string) => void;
  activeWallpaperUrl?: string;
}

type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export const VibeGame3D: React.FC<VibeGame3DProps> = ({
  onBackToStudio,
  onSendToStudio,
  activeWallpaperUrl,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // High-level Game States
  const [gameState, setGameState] = useState<GameState>('title');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(MAX_SHIELDS);
  const [combo, setCombo] = useState(1);
  const [fever, setFever] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraMode, setCameraMode] = useState<'follow' | 'cinematic'>('follow');
  const [selectedSkin, setSelectedSkin] = useState<'neon' | 'gold' | 'emerald' | 'vaporwave'>('neon');
  const [runStats, setRunStats] = useState({ distance: 0, crystals: 0, maxCombo: 1, time: 0 });
  const craftRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  // Simulation references (zero-GC, mutable)
  const sim = useRef({
    state: 'title' as GameState,
    playerLane: 1,
    currentX: 0,
    targetX: 0,
    playerY: 0,
    playerZ: 0,
    roll: 0,
    lives: MAX_SHIELDS,
    distance: 0,
    speed: 45,
    combo: 1,
    maxCombo: 1,
    streak: 0,
    isFever: false,
    feverTimer: 0,
    crystalsCollected: 0,
    crystalPoints: 0,
    invulnerableTimer: 0,
    hitstopTimer: 0,
    trauma: 0,
    nextSpawnZ: 30,
    runTime: 0,
    cameraMode: 'follow' as 'follow' | 'cinematic',
    titleAngle: 0,
  });

  // Load high score
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vibepaper_game3d_highscore');
      if (saved) setHighScore(parseInt(saved, 10) || 0);
    } catch {}
  }, []);

  // Update document.body.dataset.state for ultra-mode compliance
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Autostart parameter support (?autostart=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startGame();
    }
  }, []);

  const startGame = useCallback(() => {
    const s = sim.current;
    s.state = 'playing';
    s.playerLane = 1;
    s.currentX = 0;
    s.targetX = 0;
    s.playerY = 0;
    s.playerZ = 0;
    s.roll = 0;
    s.lives = MAX_SHIELDS;
    s.distance = 0;
    s.speed = 45;
    s.combo = 1;
    s.maxCombo = 1;
    s.streak = 0;
    s.isFever = false;
    s.feverTimer = 0;
    s.crystalsCollected = 0;
    s.crystalPoints = 0;
    s.invulnerableTimer = 0;
    s.hitstopTimer = 0;
    s.trauma = 0;
    s.nextSpawnZ = 30;
    s.runTime = 0;

    setGameState('playing');
    setScore(0);
    setLives(MAX_SHIELDS);
    setCombo(1);
    setFever(false);
  }, []);

  const pauseGame = useCallback(() => {
    if (sim.current.state === 'playing') {
      sim.current.state = 'paused';
      setGameState('paused');
    } else if (sim.current.state === 'paused') {
      sim.current.state = 'playing';
      setGameState('playing');
    }
  }, []);

  const steerCraft = useCallback((dir: -1 | 1) => {
    const s = sim.current;
    if (s.state !== 'playing') return;
    const nextLane = Math.max(0, Math.min(THREE_LANES.length - 1, s.playerLane + dir));
    if (nextLane !== s.playerLane) {
      s.playerLane = nextLane;
      s.targetX = getLane3DX(nextLane);
      s.roll = dir * 0.45; // banking roll animation
      sound.playLaneSwitch();
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'title' || gameState === 'gameover') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startGame();
        }
      } else if (gameState === 'playing') {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          steerCraft(-1);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          steerCraft(1);
        } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          e.preventDefault();
          pauseGame();
        }
      } else if (gameState === 'paused') {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          e.preventDefault();
          pauseGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, startGame, pauseGame, steerCraft]);

  // Update craft skin dynamically
  useEffect(() => {
    if (sceneRef.current && craftRef.current) {
      const scene = sceneRef.current;
      const oldCraft = craftRef.current;
      const posX = oldCraft.position.x;
      const posY = oldCraft.position.y;
      const posZ = oldCraft.position.z;
      const rotZ = oldCraft.rotation.z;
      const rotY = oldCraft.rotation.y;

      scene.remove(oldCraft);
      const newCraft = createHeroCraft(selectedSkin);
      newCraft.position.set(posX, posY, posZ);
      newCraft.rotation.set(0, rotY, rotZ);
      craftRef.current = newCraft;
      scene.add(newCraft);
    }
  }, [selectedSkin]);

  // Three.js 3D WebGL Scene & Game Loop Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL guard
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090514);
    scene.fog = new THREE.FogExp2(0x090514, 0.016);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      400
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Studio RoomEnvironment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig (Warm Key Light + Cool Hemisphere Fill)
    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    keyLight.position.set(15, 30, 20);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 100;
    keyLight.shadow.camera.left = -20;
    keyLight.shadow.camera.right = 20;
    keyLight.shadow.camera.top = 20;
    keyLight.shadow.camera.bottom = -20;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x818cf8, 0x090514, 0.85);
    scene.add(hemiLight);

    // 5. Endless Curving Neon Highway Track
    const roadTexture = createNeonRoadTexture();
    roadTexture.repeat.set(1, 30);

    const roadGeom = new THREE.PlaneGeometry(18, 400);
    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTexture,
      roughness: 0.35,
      metalness: 0.8,
    });
    const roadMesh = new THREE.Mesh(roadGeom, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0, 150);
    roadMesh.receiveShadow = !isSoftwareGl;
    scene.add(roadMesh);

    // 6. Instanced Futuristic Skyscraper Skyline (50 towers lining horizon)
    const towerCount = 60;
    const towerGeom = new THREE.BoxGeometry(4, 30, 4);
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x110e26,
      roughness: 0.25,
      metalness: 0.85,
    });
    const skylineMesh = new THREE.InstancedMesh(towerGeom, towerMat, towerCount);
    skylineMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < towerCount; i++) {
      const isLeft = i % 2 === 0;
      const x = isLeft ? -16 - Math.random() * 25 : 16 + Math.random() * 25;
      const z = (i / towerCount) * 360 - 20;
      const scaleY = 0.5 + Math.random() * 1.5;

      dummy.position.set(x, (scaleY * 30) / 2, z);
      dummy.scale.set(0.8 + Math.random() * 0.5, scaleY, 0.8 + Math.random() * 0.5);
      dummy.updateMatrix();
      skylineMesh.setMatrixAt(i, dummy.matrix);
    }
    skylineMesh.instanceMatrix.needsUpdate = true;
    scene.add(skylineMesh);

    // 7. Hero Cybercraft (Composite 8-part procedural group)
    sceneRef.current = scene;
    const craft = createHeroCraft(selectedSkin);
    craftRef.current = craft;
    scene.add(craft);

    // Obstacle & Collectible object pools in scene
    interface ActiveEntity {
      mesh: THREE.Group;
      type: 'glitch' | 'laser' | 'crystal';
      lane: number;
      z: number;
      points?: number;
      boundingRadius: number;
    }
    const entities: ActiveEntity[] = [];

    // Pre-allocated scratch helpers for zero-GC render loop
    const _scratchVec = new THREE.Vector3();
    const _scratchBoxMin = new THREE.Vector3();
    const _scratchBoxMax = new THREE.Vector3();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation & 60fps Loop with software-WebGL guard
    let frameId = 0;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = (now: number) => {
      const s = sim.current;
      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05); // clamped dt
      lastTime = now;

      // Handle hitstop timer
      if (s.hitstopTimer > 0) {
        s.hitstopTimer -= dt;
      } else if (s.state === 'playing') {
        s.runTime += dt;
        s.distance += s.speed * dt;
        s.speed = get3DRunSpeed(s.distance);

        // Smooth lane interpolation
        s.currentX = dampExp(s.currentX, s.targetX, 14, dt);
        s.roll = dampExp(s.roll, 0, 8, dt);

        const currentCraft = craftRef.current || craft;
        currentCraft.position.set(s.currentX, s.playerY, 0);
        currentCraft.rotation.z = s.roll;
        currentCraft.rotation.y = -s.roll * 0.3;

        // Fever mode countdown
        if (s.isFever) {
          s.feverTimer -= dt;
          if (s.feverTimer <= 0) {
            s.isFever = false;
            s.streak = 0;
            setFever(false);
          }
        }

        // Invulnerability blink
        if (s.invulnerableTimer > 0) {
          s.invulnerableTimer -= dt;
          currentCraft.visible = Math.floor(s.invulnerableTimer * 12) % 2 === 0;
        } else {
          currentCraft.visible = true;
        }

        // Texture offset scrolling road
        roadTexture.offset.y -= (s.speed * dt) / 18;

        // Move skyline towers backward
        for (let i = 0; i < towerCount; i++) {
          skylineMesh.getMatrixAt(i, dummy.matrix);
          dummy.position.setFromMatrixPosition(dummy.matrix);
          dummy.position.z -= s.speed * dt * 0.4;
          if (dummy.position.z < -20) {
            dummy.position.z += 360;
          }
          dummy.updateMatrix();
          skylineMesh.setMatrixAt(i, dummy.matrix);
        }
        skylineMesh.instanceMatrix.needsUpdate = true;

        // Spawn obstacles and crystals
        if (s.distance >= s.nextSpawnZ) {
          s.nextSpawnZ += Math.random() * 25 + 30;

          // Hazard spawn
          const obsLane = Math.floor(Math.random() * 3);
          const isLaser = Math.random() > 0.5;
          const obsMesh = isLaser ? createLaserGate() : createGlitchMonolith();
          obsMesh.position.set(getLane3DX(obsLane), 0, 160);
          scene.add(obsMesh);

          entities.push({
            mesh: obsMesh,
            type: isLaser ? 'laser' : 'glitch',
            lane: obsLane,
            z: 160,
            boundingRadius: 1.4,
          });

          // Crystal spawn
          const crystalLane = (obsLane + 1 + Math.floor(Math.random() * 2)) % 3;
          const crystalRand = Math.random();
          const crystalType = crystalRand > 0.7 ? 'gold' : crystalRand > 0.4 ? 'stardust' : 'neon';
          const crystalMesh = createVibeCrystal(crystalType);
          crystalMesh.position.set(getLane3DX(crystalLane), 0, 140);
          scene.add(crystalMesh);

          entities.push({
            mesh: crystalMesh,
            type: 'crystal',
            lane: crystalLane,
            z: 140,
            points: crystalType === 'gold' ? 50 : crystalType === 'stardust' ? 25 : 10,
            boundingRadius: 1.2,
          });
        }

        // Move & check collisions for active entities
        for (let i = entities.length - 1; i >= 0; i--) {
          const ent = entities[i];
          ent.z -= s.speed * dt;
          ent.mesh.position.z = ent.z;

          // Spin crystals
          if (ent.type === 'crystal') {
            ent.mesh.rotation.y += 2.5 * dt;
          }

          // Collision check near player (Z around 0)
          if (Math.abs(ent.z) < 2.5) {
            const laneDiff = Math.abs(ent.mesh.position.x - s.currentX);
            if (laneDiff < 1.8) {
              if (ent.type === 'crystal') {
                // Collect crystal!
                s.crystalsCollected += 1;
                const pts = (ent.points || 10) * (s.isFever ? 2 : 1);
                s.crystalPoints += pts;
                s.combo = Math.min(50, s.combo + 1);
                s.maxCombo = Math.max(s.maxCombo, s.combo);
                s.streak += 1;

                if (s.streak >= 5 && !s.isFever) {
                  s.isFever = true;
                  s.feverTimer = 6;
                  setFever(true);
                  sound.playFever();
                }

                setCombo(s.combo);
                sound.playOrbCollect(s.combo);

                // Cleanup entity
                scene.remove(ent.mesh);
                entities.splice(i, 1);
                continue;
              } else if (s.invulnerableTimer <= 0) {
                // Hit hazard!
                s.lives -= 1;
                s.invulnerableTimer = 1.4;
                s.hitstopTimer = 0.06; // 60ms hitstop
                s.trauma = 0.8;
                s.combo = 1;
                s.streak = 0;
                s.isFever = false;
                setLives(s.lives);
                setCombo(1);
                setFever(false);
                sound.playHit();

                // Cleanup hazard
                scene.remove(ent.mesh);
                entities.splice(i, 1);

                if (s.lives <= 0) {
                  s.state = 'gameover';
                  setGameState('gameover');
                  const finalScore = calculate3DScore(s.distance, s.crystalPoints, s.combo);
                  setScore(finalScore);
                  setRunStats({
                    distance: Math.floor(s.distance),
                    crystals: s.crystalsCollected,
                    maxCombo: s.maxCombo,
                    time: Math.floor(s.runTime),
                  });
                  if (finalScore > highScore) {
                    setHighScore(finalScore);
                    try {
                      localStorage.setItem('vibepaper_game3d_highscore', finalScore.toString());
                    } catch {}
                  }
                  sound.playGameOver();
                  break;
                }
                continue;
              }
            }
          }

          // Remove entities offscreen behind camera
          if (ent.z < -15) {
            scene.remove(ent.mesh);
            entities.splice(i, 1);
          }
        }

        // Update score state
        const currentTotal = calculate3DScore(s.distance, s.crystalPoints, s.combo);
        setScore(currentTotal);
      }

      // Camera Rig & Damping
      if (s.state === 'title') {
        // Slow cinematic orbit around hero craft on title screen
        s.titleAngle += dt * 0.4;
        camera.position.x = Math.sin(s.titleAngle) * 9;
        camera.position.y = 4.2;
        camera.position.z = Math.cos(s.titleAngle) * 9;
        camera.lookAt(0, 1.2, 0);
      } else {
        // Active gameplay camera follow with trauma shake
        const targetCamX = s.currentX * 0.45;
        const targetCamY = s.cameraMode === 'cinematic' ? 5.5 : 4.0;
        const targetCamZ = s.cameraMode === 'cinematic' ? -12.0 : -8.5;

        // Camera shake from trauma
        const shake = s.trauma * s.trauma * (Math.random() - 0.5) * 1.5;
        if (s.trauma > 0) s.trauma = Math.max(0, s.trauma - dt * 2.5);

        camera.position.x = dampExp(camera.position.x, targetCamX + shake, 10, dt);
        camera.position.y = dampExp(camera.position.y, targetCamY, 8, dt);
        camera.position.z = dampExp(camera.position.z, targetCamZ, 8, dt);
        camera.lookAt(s.currentX * 0.2, 1.6, 18);
      }

      // Render Three.js Scene
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(() => tick(performance.now()));
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (isSoftwareGl) {
        clearTimeout(frameId);
      } else {
        cancelAnimationFrame(frameId);
      }
      renderer.dispose();
      roadTexture.dispose();
      roadGeom.dispose();
      roadMat.dispose();
      towerGeom.dispose();
      towerMat.dispose();
      skylineMesh.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [highScore]);

  return (
    <div className="relative w-full h-[100dvh] bg-black select-none overflow-hidden flex flex-col justify-between">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full block" />

      {/* Live In-Game HUD (Visible during 'playing') */}
      {gameState === 'playing' && (
        <div className="relative z-20 w-full h-full p-4 pointer-events-none flex flex-col justify-between">
          {/* Top HUD Cluster (Score, Combo, Shields) */}
          <div className="max-w-4xl mx-auto w-full flex items-start justify-between">
            {/* Score & Combo */}
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                SCORE
              </div>
              <div className="text-3xl font-black text-white font-mono tracking-tight drop-shadow-lg">
                {score.toLocaleString()}
              </div>
              {combo > 1 && (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-400 animate-pulse">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{combo}x Multiplier</span>
                </div>
              )}
            </div>

            {/* Shields / Vitality Sockets */}
            <div className="flex flex-col items-end space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                SHIELDS
              </span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: MAX_SHIELDS }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border transition-all ${
                      i < lives
                        ? 'bg-emerald-400 border-emerald-300 shadow-md shadow-emerald-400/50'
                        : 'bg-zinc-800/80 border-zinc-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Fever Notification */}
          {fever && (
            <div className="self-center px-4 py-1.5 rounded-full bg-rose-600/90 text-white font-black text-xs tracking-wider animate-bounce shadow-xl shadow-rose-500/40">
              ⚡ FEVER OVERDRIVE (2X CRYSTALS) ⚡
            </div>
          )}

          {/* Mobile Touch Steer Controls */}
          <div className="pointer-events-auto flex items-center justify-between max-w-sm mx-auto w-full mb-16 sm:mb-20">
            <button
              onClick={() => steerCraft(-1)}
              className="w-16 h-16 rounded-2xl bg-black/60 active:bg-indigo-600/70 border border-white/20 text-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform cursor-pointer"
              aria-label="Steer Left"
            >
              <ArrowLeft className="w-8 h-8" />
            </button>

            <span className="text-[11px] text-white/70 font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-black/40">
              STEER
            </span>

            <button
              onClick={() => steerCraft(1)}
              className="w-16 h-16 rounded-2xl bg-black/60 active:bg-indigo-600/70 border border-white/20 text-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform cursor-pointer"
              aria-label="Steer Right"
            >
              <ArrowRight className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Bottom Control Dock (<= 15% viewport footprint) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl">
        <button
          onClick={onBackToStudio}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          <span>Exit to Studio</span>
        </button>

        <div className="w-px h-4 bg-zinc-750" />

        <button
          onClick={() => {
            sound.isMuted = !isMuted;
            setIsMuted(!isMuted);
          }}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          aria-label="Toggle Sound"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
        </button>

        {gameState === 'playing' && (
          <button
            onClick={pauseGame}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Pause (P or Esc)"
            aria-label="Pause Game"
          >
            <Pause className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => {
            const nextMode = cameraMode === 'follow' ? 'cinematic' : 'follow';
            setCameraMode(nextMode);
            sim.current.cameraMode = nextMode;
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white text-[11px] font-medium cursor-pointer"
          title="Toggle 3D Camera View"
        >
          <Video className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline capitalize">{cameraMode} Cam</span>
        </button>
      </div>

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <div className="absolute inset-0 z-40 bg-gradient-to-t from-black/95 via-black/40 to-black/70 p-6 flex flex-col items-center justify-between text-center animate-in fade-in duration-300">
          {/* Top subtle badge */}
          <div className="pt-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              THREE.JS 3D ARCADE
            </span>
          </div>

          {/* Central Hero Lockup over 35% negative space */}
          <div className="space-y-4 my-auto max-w-md">
            {/* Custom Inline SVG Title Lockup */}
            <div className="flex items-center justify-center">
              <svg viewBox="0 0 320 60" className="w-72 sm:w-80 h-auto">
                <defs>
                  <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                </defs>
                <text
                  x="160"
                  y="40"
                  textAnchor="middle"
                  fill="url(#cyberGrad)"
                  fontSize="34"
                  fontWeight="900"
                  letterSpacing="3"
                  fontFamily="system-ui, sans-serif"
                >
                  CYBER VIBE 3D
                </text>
              </svg>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium">
              Steer your composite anti-gravity craft along the neon highway, dodge laser barriers, collect vibe crystals, and forge high-score wallpapers.
            </p>

            {highScore > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-bold py-1">
                <Trophy className="w-4 h-4" />
                <span>3D Record: {highScore.toLocaleString()}</span>
              </div>
            )}

            {/* Craft Skin Selector */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Craft Neon Skin:
              </span>
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {[
                  { id: 'neon', name: '⚡ Neon', color: 'border-cyan-400 text-cyan-300' },
                  { id: 'gold', name: '✨ Gold', color: 'border-amber-400 text-amber-300' },
                  { id: 'emerald', name: '🌲 Emerald', color: 'border-emerald-400 text-emerald-300' },
                  { id: 'vaporwave', name: '🌸 Vaporwave', color: 'border-fuchsia-400 text-fuchsia-300' },
                ].map((skin) => (
                  <button
                    key={skin.id}
                    onClick={() => setSelectedSkin(skin.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      selectedSkin === skin.id
                        ? `${skin.color} bg-white/10 ring-1 ring-white/30 scale-105`
                        : 'border-zinc-800 text-zinc-400 hover:text-white bg-black/40'
                    }`}
                  >
                    {skin.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Primary Start CTA & Control Hint */}
          <div className="w-full max-w-sm space-y-3 pb-12">
            <button
              onClick={startGame}
              data-start="true"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-black text-sm tracking-widest shadow-2xl shadow-indigo-500/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              aria-label="Start 3D Game"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>START 3D RUN (SPACE / ENTER)</span>
            </button>

            {/* Single flat control hint line */}
            <div className="text-xs text-zinc-400 font-medium">
              A / D or Arrow Keys Steer · Space Boost · Esc Pause
            </div>
          </div>
        </div>
      )}

      {/* Paused Modal */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-40 bg-black/85 p-6 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in">
          <h3 className="text-2xl font-black text-white tracking-wider">3D RUN PAUSED</h3>
          <div className="text-xs text-zinc-400">Current Score: {score.toLocaleString()}</div>
          <div className="w-full max-w-[220px] space-y-2">
            <button
              onClick={pauseGame}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wider transition-colors cursor-pointer"
            >
              RESUME
            </button>
            <button
              onClick={startGame}
              className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs tracking-wider transition-colors cursor-pointer"
            >
              RESTART
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-40 bg-black/90 p-6 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
          <div className="space-y-4 max-w-sm w-full">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-rose-500">
                SHIELD CRITICAL • RUN TERMINATED
              </span>
              <h3 className="text-3xl font-black text-white tracking-tight">RUN FINISHED</h3>
            </div>

            {/* Run Stats */}
            <div className="grid grid-cols-2 gap-2 bg-zinc-900 border border-zinc-800 p-3.5 rounded-2xl text-left">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold">SCORE</span>
                <p className="text-xl font-black text-white font-mono">{score.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold">BEST</span>
                <p className="text-xl font-black text-amber-400 font-mono">
                  {Math.max(score, highScore).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold">DISTANCE</span>
                <p className="text-sm font-bold text-zinc-200">{runStats.distance}m</p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold">MAX COMBO</span>
                <p className="text-sm font-bold text-indigo-400">{runStats.maxCombo}x</p>
              </div>
            </div>

            {/* Action 1: Craft Wallpaper from this 3D Run */}
            <button
              onClick={() => {
                const prompt = `futuristic 3D cyber highway runner with glowing neon grid, luminous skyscrapers, speed streaks, and anti-gravity craft at score ${score}`;
                onSendToStudio(prompt);
              }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-purple-950/80 border border-purple-500/40 hover:bg-purple-900 text-purple-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Wand2 className="w-4 h-4 text-purple-400" />
              <span>Turn Run Into Phone Wallpaper</span>
            </button>

            {/* Action 2: Play Again CTA */}
            <button
              onClick={startGame}
              data-start="true"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-black text-sm tracking-wider shadow-xl shadow-indigo-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              aria-label="Play Again"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY AGAIN (ENTER)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
