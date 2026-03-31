import { useMemo } from 'react';
import './Engine.css';

export type EngineState = 'idle' | 'armed' | 'forging' | 'done' | 'error';

export interface EngineChip {
  id: string;
  category: string;
  label: string;
  color: string;
}

interface EngineProps {
  state: EngineState;
  chips?: EngineChip[];
  size?: number;
  className?: string;
}

/* Deterministic pseudo-random for stable particle positions */
function seeded(a: number, b: number): number {
  return ((Math.sin(a * 127.1 + b * 311.7) * 43758.5453) % 1 + 1) % 1;
}

const CATEGORY_COLORS: Record<string, string> = {
  exclude: '#FF4757', access: '#00F5D4', weight: '#00BBF9',
  payment: '#FEE440', revenue: '#9B5DE5', item: '#F15BB5',
  config: '#8AC4FF', pricing: '#00F5D4', stock: '#00BBF9',
  swap: '#F15BB5', airdrop: '#FEE440',
};

export function chipColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#778CA3';
}

/* Converge particle config — 32 particles from edges */
const CONVERGE_COUNT = 32;
const convergeParticles = Array.from({ length: CONVERGE_COUNT }, (_, i) => {
  const angle = (360 / CONVERGE_COUNT) * i + seeded(i, 13) * 8;
  const dist = 1.0 + seeded(i, 99) * 0.5;
  const delay = seeded(i, 42) * 1.0;
  const dur = 0.7 + seeded(i, 77) * 0.6;
  const brightness = 0.6 + seeded(i, 33) * 0.4;
  const size = 2 + seeded(i, 55) * 3;
  return { angle, dist, delay, dur, brightness, size };
});

/* Per-chip trailing particles — REMOVED, chips are now embedded in ring */

/* Victory burst config — radial particles on forge complete */
const BURST_COUNT = 24;
const burstParticles = Array.from({ length: BURST_COUNT }, (_, i) => {
  const angle = (360 / BURST_COUNT) * i + seeded(i, 17) * 10;
  const delay = seeded(i, 31) * 0.3;
  const dur = 0.8 + seeded(i, 61) * 0.8;
  const dist = 0.5 + seeded(i, 73) * 0.5;
  return { angle, delay, dur, dist };
});

export function Engine({ state, chips = [], size = 380, className = '' }: EngineProps) {
  const slotCount = Math.max(chips.length, 6);
  const maxSlots = Math.min(slotCount, 8);

  const slots = useMemo(() => {
    const arr: Array<{ angle: number; chip?: EngineChip }> = [];
    for (let i = 0; i < maxSlots; i++) {
      arr.push({ angle: (360 / maxSlots) * i - 90, chip: chips[i] });
    }
    return arr;
  }, [chips, maxSlots]);

  const orbitCount = state === 'forging' ? 14 : state === 'armed' ? 8 : 6;
  const orbitDuration = state === 'forging' ? 1.5 : state === 'armed' ? 4 : 6;

  const driftParticles = useMemo(() => {
    if (state === 'idle') return [];
    const out: Array<{ key: string; angle: number; color: string; dx: number; dy: number; delay: number; dur: number }> = [];
    chips.forEach((chip, ci) => {
      const count = state === 'forging' ? 6 : 4;
      const angle = (360 / maxSlots) * ci - 90;
      for (let j = 0; j < count; j++) {
        out.push({
          key: `${chip.id}-${j}`,
          angle,
          color: chip.color,
          dx: (seeded(ci, j * 2) - 0.5) * 60,
          dy: (seeded(ci, j * 2 + 1) - 0.5) * 60,
          delay: seeded(ci + 10, j) * 2,
          dur: 1.2 + seeded(ci, j + 50) * 1.2,
        });
      }
    });
    return out;
  }, [chips, state, maxSlots]);

  const stateLabel: Record<EngineState, string> = {
    idle: 'IDLE', armed: 'READY', forging: 'FORGING', done: 'FORGED', error: 'ERROR',
  };

  return (
    <div
      className={`engine engine--${state} ${className}`}
      style={{ '--engine-size': `${size}px` } as React.CSSProperties}
    >
      {/* Converge particles (visible on hover via CSS) */}
      <div className="engine__converge-layer" aria-hidden="true">
        {convergeParticles.map((p, i) => (
          <span
            key={`cvg-${i}`}
            className="engine__converge-dot"
            style={{
              '--cvg-angle': `${p.angle}deg`,
              '--cvg-dist': `${p.dist}`,
              '--cvg-delay': `${p.delay}s`,
              '--cvg-dur': `${p.dur}s`,
              '--cvg-bright': `${p.brightness}`,
              '--cvg-size': `${p.size}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Ambient background glow */}
      <div className="engine__ambient" />

      {/* Outer metallic ring with tick marks */}
      <div className="engine__ring engine__ring--outer">
        <div className="engine__ticks" />
      </div>

      {/* Middle rotating orbit ring */}
      <div className="engine__ring engine__ring--mid">
        {Array.from({ length: orbitCount }, (_, i) => (
          <span
            key={`orb-${i}`}
            className="engine__orbit-dot"
            style={{
              '--orb-delay': `${(i / orbitCount) * orbitDuration}s`,
              '--orb-dur': `${orbitDuration}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Inner counter-rotating ring */}
      <div className="engine__ring engine__ring--inner" />

      {/* Chip slots (rotating container) */}
      <div className="engine__slots">
        {slots.map(({ angle, chip }, i) => (
          <div
            key={`slot-${i}`}
            className={`engine__slot ${chip ? 'engine__slot--filled' : ''}`}
            style={{
              '--slot-angle': `${angle}deg`,
              '--chip-color': chip?.color ?? 'transparent',
            } as React.CSSProperties}
            title={chip?.label}
          >
            {chip && <div className="engine__slot-glow" />}
          </div>
        ))}
      </div>

      {/* Victory burst particles (done state only) */}
      {state === 'done' && (
        <div className="engine__burst-layer" aria-hidden="true">
          {burstParticles.map((p, i) => (
            <span
              key={`burst-${i}`}
              className="engine__burst-dot"
              style={{
                '--burst-angle': `${p.angle}deg`,
                '--burst-delay': `${p.delay}s`,
                '--burst-dur': `${p.dur}s`,
                '--burst-dist': `${p.dist}`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Drift particles from filled slots */}
      {driftParticles.map(p => (
        <span
          key={p.key}
          className="engine__drift"
          style={{
            '--da': `${p.angle}deg`,
            '--dc': p.color,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--dd': `${p.delay}s`,
            '--ddur': `${p.dur}s`,
          } as React.CSSProperties}
        />
      ))}

      {/* Core */}
      <div className="engine__core">
        <div className="engine__core-pulse" />
        <div className="engine__core-inner">
          <span className="engine__core-label">{stateLabel[state]}</span>
        </div>
      </div>

      {/* Rotating scanner beam */}
      <div className="engine__scanner" />
    </div>
  );
}
