import React from 'react';
import { ControlPanel } from './ControlPanel';
import { GameStats } from './GameStats';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';
import { CollectionPanel } from './CollectionPanel';
import type { Enemy, Tower, Projectile, Particle, TowerType, TowerStyle, PaintEssence } from '../types/entities';
import type { GameState as TGameState } from '../types/game';

interface GameLayoutProps {
  wave: number;
  coreHealth: number;
  score: number;
  enemiesKilled: number;
  paint: PaintEssence;
  selectedTowerType: TowerType | null;
  onSelectTowerType: (type: TowerType | null) => void;
  selectedStyle: TowerStyle;
  onSelectStyle: (style: TowerStyle) => void;
  enemies: Enemy[];
  towers: Tower[];
  projectiles: Projectile[];
  particles: Particle[];
  waveInProgress: boolean;
  gameState: TGameState;
  setGameState: (state: TGameState) => void;
  collectedTowers: Set<string>;
  onPlaceTower: (x: number, y: number) => void;
  onUpgradeTower: (towerId: number) => void;
  onStartWave: () => void;
  onSkipWave: () => void;
}

export const GameLayout: React.FC<GameLayoutProps> = ({
  wave,
  coreHealth,
  score,
  enemiesKilled,
  paint,
  selectedTowerType,
  onSelectTowerType,
  selectedStyle,
  onSelectStyle,
  enemies,
  towers,
  projectiles,
  particles,
  waveInProgress,
  gameState,
  setGameState,
  collectedTowers,
  onPlaceTower,
  onUpgradeTower,
  onStartWave,
  onSkipWave,
}) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      <ControlPanel
        paint={paint}
        selectedTowerType={selectedTowerType}
        onSelectTowerType={onSelectTowerType}
        selectedStyle={selectedStyle}
        onSelectStyle={onSelectStyle}
      />

      <div className="flex flex-col items-center">
        <GameStats
          wave={wave}
          coreHealth={coreHealth}
          score={score}
          enemiesKilled={enemiesKilled}
        />

        <GameBoard
          enemies={enemies}
          towers={towers}
          projectiles={projectiles}
          particles={particles}
          coreHealth={coreHealth}
          selectedTowerType={selectedTowerType}
          onPlaceTower={onPlaceTower}
          onUpgradeTower={onUpgradeTower}
        />

        <GameControls
          wave={wave}
          waveInProgress={waveInProgress}
          enemiesCount={enemies.length}
          gameState={gameState}
          onStartWave={onStartWave}
          onSkipWave={onSkipWave}
          onTogglePause={() => setGameState(gameState === 'paused' ? 'playing' : 'paused')}
        />
      </div>

      <CollectionPanel
        collectedTowers={collectedTowers}
        enemiesKilled={enemiesKilled}
        score={score}
        towersCount={towers.length}
      />
    </div>
  );
};
