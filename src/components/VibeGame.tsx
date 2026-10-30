import React, { useRef, useEffect, useState, useCallback } from 'react';
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
} from 'lucide-react';
import {
  calculateScore,
  updateCombo,
  isFeverActive,
  getLaneX,
  checkAABBCollision,
  getRunSpeed,
  formatRunTime,
  LANES_COUNT,
  MAX_LIVES,
  Obstacle,
  Collectible,
} from '../game/rules';
import { sound } from '../game/audio';

interface VibeGameProps {
  onBackToStudio: () => void;
  onSendToStudio: (vibePrompt: string) => void;
  activeWallpaperUrl?: string;
}

type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export const VibeGame: React.FC<VibeGameProps> = ({
  onBackToStudio,
  onSendToStudio,
  activeWallpaperUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High-level state machine
  const [gameState, setGameState] = useState<GameState>('title');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [combo, setCombo] = useState(1);
  const [fever, setFever] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [runStats, setRunStats] = useState({ distance: 0, orbs: 0, maxCombo: 1, time: 0 });

  // References for 60fps simulation loop
  const simRef = useRef({
    state: 'title' as GameState,
    playerLane: 1,
    targetLaneX: 180,
    playerX: 180,
    playerY: 520,
    playerWidth: 42,
    playerHeight: 46,
    lives: MAX_LIVES,
    distance: 0,
    speed: 260,
    combo: 1,
    maxCombo: 1,
    orbStreak: 0,
    isFever: false,
    feverTimer: 0,
    orbsCollected: 0,
    orbsPoints: 0,
    obstacles: [] as Obstacle[],
    collectibles: [] as Collectible[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[],
    invulnerableTimer: 0,
    lastTime: performance.now(),
    nextSpawnDistance: 30,
    runTime: 0,
  });

  // Load high score
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vibepaper_game_highscore');
      if (saved) setHighScore(parseInt(saved, 10) || 0);
    } catch {}
  }, []);

  // Update document.body.dataset.state for ultra-mode compliance
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Handle autostart query parameter (?autostart=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startGame();
    }
  }, []);

  const startGame = useCallback(() => {
    const sim = simRef.current;
    sim.state = 'playing';
    sim.playerLane = 1;
    sim.playerX = 180;
    sim.targetLaneX = 180;
    sim.playerY = 520;
    sim.lives = MAX_LIVES;
    sim.distance = 0;
    sim.speed = 260;
    sim.combo = 1;
    sim.maxCombo = 1;
    sim.orbStreak = 0;
    sim.isFever = false;
    sim.feverTimer = 0;
    sim.orbsCollected = 0;
    sim.orbsPoints = 0;
    sim.obstacles = [];
    sim.collectibles = [];
    sim.particles = [];
    sim.invulnerableTimer = 0;
    sim.lastTime = performance.now();
    sim.nextSpawnDistance = 25;
    sim.runTime = 0;

    setGameState('playing');
    setScore(0);
    setLives(MAX_LIVES);
    setCombo(1);
    setFever(false);
  }, []);

  const pauseGame = useCallback(() => {
    if (simRef.current.state === 'playing') {
      simRef.current.state = 'paused';
      setGameState('paused');
    } else if (simRef.current.state === 'paused') {
      simRef.current.state = 'playing';
      simRef.current.lastTime = performance.now();
      setGameState('playing');
    }
  }, []);

  const movePlayer = useCallback((dir: -1 | 1) => {
    const sim = simRef.current;
    if (sim.state !== 'playing') return;
    const newLane = Math.max(0, Math.min(LANES_COUNT - 1, sim.playerLane + dir));
    if (newLane !== sim.playerLane) {
      sim.playerLane = newLane;
      sim.targetLaneX = getLaneX(newLane, LANES_COUNT, 360);
      sound.playLaneSwitch();
      // Trail particles on dash
      for (let i = 0; i < 6; i++) {
        sim.particles.push({
          x: sim.playerX,
          y: sim.playerY + 20,
          vx: (Math.random() - 0.5) * 60,
          vy: Math.random() * 40 + 20,
          life: 0.25,
          color: sim.isFever ? '#f43f5e' : '#38bdf8',
          size: Math.random() * 3 + 2,
        });
      }
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
          movePlayer(-1);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          movePlayer(1);
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
  }, [gameState, startGame, pauseGame, movePlayer]);

  // Main 60fps Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = (time: number) => {
      const sim = simRef.current;
      const rawDt = (time - sim.lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05); // clamped dt
      sim.lastTime = time;

      const trackW = 360;
      const trackH = 640;

      // Update simulation if playing
      if (sim.state === 'playing') {
        sim.runTime += dt;
        sim.distance += (sim.speed * dt) / 50;
        sim.speed = getRunSpeed(sim.distance);

        // Smooth player lane interpolation
        sim.playerX += (sim.targetLaneX - sim.playerX) * Math.min(1, dt * 18);

        // Invulnerability countdown
        if (sim.invulnerableTimer > 0) {
          sim.invulnerableTimer -= dt;
        }

        // Fever countdown
        if (sim.isFever) {
          sim.feverTimer -= dt;
          if (sim.feverTimer <= 0) {
            sim.isFever = false;
            sim.orbStreak = 0;
            setFever(false);
          }
        }

        // Spawning obstacles & collectibles
        if (sim.distance >= sim.nextSpawnDistance) {
          sim.nextSpawnDistance += Math.random() * 18 + 22;

          // Pick lane for obstacle
          const obsLane = Math.floor(Math.random() * LANES_COUNT);
          const obsType = Math.random() > 0.4 ? 'barrier' : 'glitch';

          sim.obstacles.push({
            id: `obs-${Math.random()}`,
            lane: obsLane,
            y: -40,
            width: 60,
            height: 24,
            type: obsType,
            speed: sim.speed,
          });

          // In another lane, spawn a collectible orb
          const orbLane = (obsLane + 1 + Math.floor(Math.random() * (LANES_COUNT - 1))) % LANES_COUNT;
          const orbRand = Math.random();
          const orbType = orbRand > 0.7 ? 'gold' : orbRand > 0.4 ? 'stardust' : 'neon';
          const points = orbType === 'gold' ? 50 : orbType === 'stardust' ? 25 : 10;

          sim.collectibles.push({
            id: `orb-${Math.random()}`,
            lane: orbLane,
            y: -80,
            radius: 12,
            type: orbType,
            points,
          });
        }

        // Move obstacles down
        for (let i = sim.obstacles.length - 1; i >= 0; i--) {
          const obs = sim.obstacles[i];
          obs.y += sim.speed * dt;

          // Collision check with player
          const obsX = getLaneX(obs.lane, LANES_COUNT, trackW);
          if (
            sim.invulnerableTimer <= 0 &&
            checkAABBCollision(
              { x: sim.playerX, y: sim.playerY, width: sim.playerWidth, height: sim.playerHeight },
              { x: obsX, y: obs.y, width: obs.width, height: obs.height }
            )
          ) {
            // Hit!
            sim.lives -= 1;
            sim.invulnerableTimer = 1.2;
            sim.combo = 1;
            sim.orbStreak = 0;
            sim.isFever = false;
            setLives(sim.lives);
            setCombo(1);
            setFever(false);
            sound.playHit();

            // Explosion particles
            for (let p = 0; p < 18; p++) {
              sim.particles.push({
                x: sim.playerX,
                y: sim.playerY,
                vx: (Math.random() - 0.5) * 180,
                vy: (Math.random() - 0.5) * 180,
                life: 0.4,
                color: '#ef4444',
                size: Math.random() * 4 + 2,
              });
            }

            // Remove obstacle
            sim.obstacles.splice(i, 1);

            // Game over check
            if (sim.lives <= 0) {
              sim.state = 'gameover';
              setGameState('gameover');
              const finalScore = calculateScore(sim.distance, sim.orbsPoints, sim.combo);
              setScore(finalScore);
              setRunStats({
                distance: Math.floor(sim.distance),
                orbs: sim.orbsCollected,
                maxCombo: sim.maxCombo,
                time: Math.floor(sim.runTime),
              });
              if (finalScore > highScore) {
                setHighScore(finalScore);
                try {
                  localStorage.setItem('vibepaper_game_highscore', finalScore.toString());
                } catch {}
              }
              sound.playGameOver();
              break;
            }
            continue;
          }

          // Remove offscreen
          if (obs.y > trackH + 50) {
            sim.obstacles.splice(i, 1);
          }
        }

        // Move collectibles down
        for (let i = sim.collectibles.length - 1; i >= 0; i--) {
          const orb = sim.collectibles[i];
          orb.y += sim.speed * dt;

          const orbX = getLaneX(orb.lane, LANES_COUNT, trackW);
          const distToPlayer = Math.hypot(sim.playerX - orbX, sim.playerY - orb.y);

          // Collect orb
          if (distToPlayer < orb.radius + sim.playerWidth / 2) {
            sim.orbsCollected += 1;
            const pts = orb.points * (sim.isFever ? 2 : 1);
            sim.orbsPoints += pts;
            sim.combo = updateCombo(sim.combo, 'orb');
            sim.maxCombo = Math.max(sim.maxCombo, sim.combo);
            sim.orbStreak += 1;

            if (isFeverActive(sim.orbStreak) && !sim.isFever) {
              sim.isFever = true;
              sim.feverTimer = 6;
              setFever(true);
              sound.playFever();
            }

            setCombo(sim.combo);
            sound.playOrbCollect(sim.combo);

            // Particle sparkles
            for (let p = 0; p < 8; p++) {
              sim.particles.push({
                x: orbX,
                y: orb.y,
                vx: (Math.random() - 0.5) * 80,
                vy: (Math.random() - 0.5) * 80,
                life: 0.3,
                color: orb.type === 'gold' ? '#f59e0b' : '#38bdf8',
                size: Math.random() * 3 + 2,
              });
            }

            sim.collectibles.splice(i, 1);
            continue;
          }

          if (orb.y > trackH + 30) {
            sim.collectibles.splice(i, 1);
          }
        }

        // Update score
        const currentTotalScore = calculateScore(sim.distance, sim.orbsPoints, sim.combo);
        setScore(currentTotalScore);
      }

      // Update particles
      for (let i = sim.particles.length - 1; i >= 0; i--) {
        const p = sim.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) {
          sim.particles.splice(i, 1);
        }
      }

      // ----------------- DRAWING -----------------
      ctx.clearRect(0, 0, trackW, trackH);

      // 1. Perspective Grid Track
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, trackW, trackH);

      // Lane dividers
      ctx.strokeStyle = sim.isFever ? 'rgba(244, 63, 94, 0.4)' : 'rgba(99, 102, 241, 0.25)';
      ctx.lineWidth = 2;
      for (let l = 1; l < LANES_COUNT; l++) {
        const lx = (trackW / LANES_COUNT) * l;
        ctx.beginPath();
        ctx.setLineDash([12, 12]);
        ctx.lineDashOffset = -(sim.distance * 12) % 24;
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, trackH);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Horizon glow
      const horizonGrad = ctx.createLinearGradient(0, 0, 0, 180);
      horizonGrad.addColorStop(0, sim.isFever ? 'rgba(236, 72, 153, 0.35)' : 'rgba(79, 70, 229, 0.25)');
      horizonGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, 0, trackW, 180);

      // 2. Draw Collectibles
      for (const orb of sim.collectibles) {
        const ox = getLaneX(orb.lane, LANES_COUNT, trackW);
        const glowColor =
          orb.type === 'gold' ? '#fbbf24' : orb.type === 'stardust' ? '#c084fc' : '#38bdf8';

        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 14;
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(ox, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ox, orb.y, orb.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 3. Draw Obstacles
      for (const obs of sim.obstacles) {
        const ox = getLaneX(obs.lane, LANES_COUNT, trackW);
        ctx.save();
        ctx.translate(ox, obs.y);

        ctx.shadowColor = obs.type === 'glitch' ? '#ec4899' : '#f97316';
        ctx.shadowBlur = 12;

        ctx.fillStyle = obs.type === 'glitch' ? '#db2777' : '#ea580c';
        ctx.beginPath();
        ctx.roundRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height, 6);
        ctx.fill();

        // Hazard warning stripes
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-obs.width / 4, -obs.height / 2);
        ctx.lineTo(-obs.width / 4 + 8, obs.height / 2);
        ctx.moveTo(obs.width / 4 - 8, -obs.height / 2);
        ctx.lineTo(obs.width / 4, obs.height / 2);
        ctx.stroke();

        ctx.restore();
      }

      // 4. Draw Particles
      for (const p of sim.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life * 3);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 5. Draw Player Cyber Craft
      const isBlinking = sim.invulnerableTimer > 0 && Math.floor(sim.invulnerableTimer * 10) % 2 === 0;
      if (!isBlinking) {
        ctx.save();
        ctx.translate(sim.playerX, sim.playerY);

        // Ship glow
        ctx.shadowColor = sim.isFever ? '#f43f5e' : '#6366f1';
        ctx.shadowBlur = 18;

        // Ship Body (Triangle Jet)
        ctx.fillStyle = sim.isFever ? '#f43f5e' : '#4f46e5';
        ctx.beginPath();
        ctx.moveTo(0, -sim.playerHeight / 2);
        ctx.lineTo(sim.playerWidth / 2, sim.playerHeight / 2);
        ctx.lineTo(0, sim.playerHeight / 2 - 8);
        ctx.lineTo(-sim.playerWidth / 2, sim.playerHeight / 2);
        ctx.closePath();
        ctx.fill();

        // Cockpit canopy
        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.ellipse(0, -2, 6, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Thruster flame
        ctx.fillStyle = sim.isFever ? '#fbbf24' : '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(-8, sim.playerHeight / 2 - 6);
        ctx.lineTo(0, sim.playerHeight / 2 + (Math.random() * 12 + 10));
        ctx.lineTo(8, sim.playerHeight / 2 - 6);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [highScore]);

  return (
    <div className="relative w-full max-w-md mx-auto flex flex-col items-center select-none py-2 px-3">
      {/* Top Game Navigation & Mute Bar */}
      <div className="w-full flex items-center justify-between mb-2 px-1">
        <button
          onClick={onBackToStudio}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          <span>Exit to Studio</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Mute button */}
          <button
            onClick={() => {
              sound.isMuted = !isMuted;
              setIsMuted(!isMuted);
            }}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Pause button if playing */}
          {gameState === 'playing' && (
            <button
              onClick={pauseGame}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
              title="Pause (P or Esc)"
              aria-label="Pause Game"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 9:16 Phone Shell Container */}
      <div className="relative w-[360px] h-[640px] rounded-[2.5rem] overflow-hidden border-[6px] border-zinc-900 bg-zinc-950 shadow-2xl ring-1 ring-white/10 flex flex-col justify-between">
        {/* Real-time reactive background wallpaper layer */}
        {activeWallpaperUrl && (
          <img
            src={activeWallpaperUrl}
            alt="Game background wallpaper"
            className="absolute inset-0 w-full h-full object-cover opacity-35 filter blur-[1px] pointer-events-none"
          />
        )}

        {/* 60fps Gameplay Canvas */}
        <canvas
          ref={canvasRef}
          width={360}
          height={640}
          className="absolute inset-0 w-full h-full block"
        />

        {/* Live In-Game HUD (Visible during 'playing') */}
        {gameState === 'playing' && (
          <div className="relative z-20 w-full p-4 pointer-events-none flex flex-col justify-between h-full">
            {/* Top HUD bar */}
            <div className="flex items-start justify-between">
              {/* Score & Combo */}
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  SCORE
                </div>
                <div className="text-2xl font-black text-white font-mono tracking-tight drop-shadow-md">
                  {score.toLocaleString()}
                </div>
                {combo > 1 && (
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400 animate-pulse">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{combo}x Combo</span>
                  </div>
                )}
              </div>

              {/* Shields / Vitality Pips */}
              <div className="flex flex-col items-end space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  SHIELDS
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: MAX_LIVES }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3.5 h-3.5 rounded-full border transition-all ${
                        i < lives
                          ? 'bg-emerald-400 border-emerald-300 shadow-sm shadow-emerald-400/50'
                          : 'bg-zinc-800/80 border-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Fever Banner if active */}
            {fever && (
              <div className="self-center px-3 py-1 rounded-full bg-rose-600/90 text-white font-extrabold text-xs tracking-wider animate-bounce shadow-lg shadow-rose-500/40">
                ⚡ FEVER MODE (2X PTS) ⚡
              </div>
            )}

            {/* Bottom Mobile Touch Controls */}
            <div className="pointer-events-auto flex items-center justify-between pt-4">
              <button
                onClick={() => movePlayer(-1)}
                className="w-16 h-16 rounded-2xl bg-black/60 active:bg-indigo-600/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
                aria-label="Move left"
              >
                <ArrowLeft className="w-8 h-8" />
              </button>

              <span className="text-[10px] text-white/60 font-semibold tracking-wider">
                SWIPE OR TAP ARROWS
              </span>

              <button
                onClick={() => movePlayer(1)}
                className="w-16 h-16 rounded-2xl bg-black/60 active:bg-indigo-600/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
                aria-label="Move right"
              >
                <ArrowRight className="w-8 h-8" />
              </button>
            </div>
          </div>
        )}

        {/* Title Screen Overlay */}
        {gameState === 'title' && (
          <div className="relative z-30 w-full h-full bg-black/85 backdrop-blur-md p-6 flex flex-col items-center justify-between text-center animate-in fade-in duration-300">
            {/* Top Phone Lock Notch */}
            <div className="w-24 h-4 bg-zinc-900 rounded-full mx-auto" />

            <div className="space-y-3 my-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/30 text-white">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tight text-white">
                  VIBE RUNNER
                </h2>
                <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
                  Cyber Lock Screen Arcade
                </p>
              </div>

              <p className="text-xs text-zinc-400 max-w-[240px] mx-auto leading-relaxed">
                Dodge glitch barriers, collect neon orbs, build combos, and unlock phone wallpapers!
              </p>

              {highScore > 0 && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-semibold py-1">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>High Score: {highScore.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="w-full space-y-2">
              <button
                onClick={startGame}
                data-start="true"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-indigo-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                aria-label="Start Game"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>START RUN (SPACE / ENTER)</span>
              </button>

              <div className="text-[11px] text-zinc-500">
                Left / Right arrow keys or A / D to steer
              </div>
            </div>
          </div>
        )}

        {/* Paused Modal */}
        {gameState === 'paused' && (
          <div className="relative z-30 w-full h-full bg-black/85 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in">
            <h3 className="text-xl font-black text-white tracking-wider">GAME PAUSED</h3>
            <div className="text-xs text-zinc-400">Current Score: {score.toLocaleString()}</div>
            <div className="w-full max-w-[200px] space-y-2">
              <button
                onClick={pauseGame}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer"
              >
                RESUME
              </button>
              <button
                onClick={startGame}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs tracking-wide transition-colors cursor-pointer"
              >
                RESTART
              </button>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState === 'gameover' && (
          <div className="relative z-30 w-full h-full bg-black/90 backdrop-blur-md p-6 flex flex-col items-center justify-between text-center animate-in fade-in duration-300">
            <div className="w-24 h-4 bg-zinc-900 rounded-full mx-auto" />

            <div className="space-y-4 my-auto w-full">
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-widest text-rose-500">
                  CIRCUIT BREACHED
                </div>
                <h3 className="text-3xl font-black text-white tracking-tight">RUN FINISHED</h3>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl text-left">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">SCORE</span>
                  <p className="text-lg font-black text-white font-mono">{score.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">BEST</span>
                  <p className="text-lg font-black text-amber-400 font-mono">
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

              {/* Reward: Turn Run Vibe into Wallpaper */}
              <button
                onClick={() => {
                  const generatedVibe = `high-speed neon cyber runner aesthetic at ${score} score with luminous streaks and futuristic highway glow`;
                  onSendToStudio(generatedVibe);
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 hover:bg-purple-900 text-purple-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Craft Wallpaper From This Run</span>
              </button>
            </div>

            <div className="w-full space-y-2">
              <button
                onClick={startGame}
                data-start="true"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-indigo-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                aria-label="Play Again"
              >
                <RotateCcw className="w-4 h-4" />
                <span>PLAY AGAIN (ENTER)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
