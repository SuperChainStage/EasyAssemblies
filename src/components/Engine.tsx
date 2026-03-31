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
  exclude: '#FF4757', access: '#26DE81', weight: '#45AAF2',
  payment: '#FFC312', revenue: '#A55EEA', item: '#FF6348',
  config: '#778CA3', pricing: '#2BCBBA', stock: '#0ABDE3',
  swap: '#FD79A8', airdrop: '#A3CB38',
};

export function chipColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#778CA3';
}

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

  const orbitCount = state === 'forging' ? 10 : state === 'armed' ? 6 : 3;
  const orbitDuration = state === 'forging' ? 2 : state === 'armed' ? 5 : 8;

  const driftParticles = useMemo(() => {
    if (state === 'idle') return [];
    const out: Array<{ key: string; angle: number; color: string; dx: number; dy: number; delay: number; dur: number }> = [];
    chips.forEach((chip, ci) => {
      const count = state === 'forging' ? 5 : 3;
      const angle = (360 / maxSlots) * ci - 90;
      for (let j = 0; j < count; j++) {
        out.push({
          key: `${chip.id}-${j}`,
          angle,
          color: chip.color,
          dx: (seeded(ci, j * 2) - 0.5) * 50,
          dy: (seeded(ci, j * 2 + 1) - 0.5) * 50,
          delay: seeded(ci + 10, j) * 2,
          dur: 1.5 + seeded(ci, j + 50) * 1.5,
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

      {/* Chip slots */}
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
