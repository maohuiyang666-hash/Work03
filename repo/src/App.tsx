import React from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import {
  MenuScreen,
  GameOverScreen,
  VictoryScreen,
  ControlPanel,
  CollectionPanel,
  GameStats,
  GameBoard,
} from './components';

export default function CanvasDefender() {
  const { state, actions } = useGameEngine();
  const {
    gameState,
    wave,
    coreHealth,
    paint,
    enemies,
    towers,
    projectiles,
    particles,
    selectedTowerType,
    selectedStyle,
    score,
    enemiesKilled,
    waveInProgress,
    collectedTowers,
  } = state;

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4"
         style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, #e8d5c4 48px), repeating-linear-gradient(90deg, transparent, transparent 47px, #e8d5c4 48px)' }}>
      
      {gameState === 'menu' && (
        <MenuScreen onStart={actions.startGame} />
      )}

      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="flex flex-wrap gap-4 justify-center">
          <ControlPanel
            paint={paint}
            selectedTowerType={selectedTowerType}
            selectedStyle={selectedStyle}
            onSelectTower={actions.setSelectedTowerType}
            onSelectStyle={actions.setSelectedStyle}
          />

          <div className="flex flex-col items-center">
            <GameStats
              wave={wave}
              coreHealth={coreHealth}
              score={score}
              enemiesKilled={enemiesKilled}
            />

            <GameBoard
              towers={towers}
              enemies={enemies}
              projectiles={projectiles}
              particles={particles}
              coreHealth={coreHealth}
              selectedTowerType={selectedTowerType}
              onPlaceTower={actions.placeTower}
              onUpgradeTower={actions.upgradeTower}
            />

            <div className="flex gap-3 mt-3">
              {!waveInProgress ? (
                <button onClick={actions.startWave}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg">
                  🚀 开始第 {wave} 波 {wave > 1 && `(+10全部精华)`}
                </button>
              ) : (
                <div className="px-6 py-3 bg-orange-500 text-white rounded-full font-bold shadow-lg animate-pulse">
                  ⚔️ 战斗中... ({enemies.length}只颜料怪)
                </div>
              )}
              
              <button onClick={() => actions.setGameState(gameState === 'playing' ? 'paused' : 'playing')}
                      className="px-6 py-3 bg-gray-600 text-white rounded-full font-bold hover:bg-gray-700 transition-all shadow-lg">
                {gameState === 'playing' ? '⏸️ 暂停' : '▶️ 继续'}
              </button>
            </div>
          </div>

          <CollectionPanel
            collectedTowers={collectedTowers}
            enemiesKilled={enemiesKilled}
            score={score}
            towers={towers}
          />
        </div>
      )}

      {gameState === 'gameOver' && (
        <GameOverScreen
          wave={wave}
          enemiesKilled={enemiesKilled}
          score={score}
          collectedTowersSize={collectedTowers.size}
          onRestart={actions.startGame}
        />
      )}

      {gameState === 'victory' && (
        <VictoryScreen
          enemiesKilled={enemiesKilled}
          score={score}
          collectedTowersSize={collectedTowers.size}
          coreHealth={coreHealth}
          onRestart={actions.startGame}
        />
      )}

      <div className="mt-4 text-amber-600 text-sm opacity-70">
        🎨 绘世守护者 - 用画笔守护你的世界
      </div>
    </div>
  );
}
