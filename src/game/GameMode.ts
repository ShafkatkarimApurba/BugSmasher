export type GameModeId = 'standard' | 'endless' | 'boss_rush';

export interface GameModeConfig {
  id: GameModeId;
  labelKey: string;
  descriptionKey: string;
  endlessWaves: boolean;
  bossEveryWave: boolean;
  waveScaleBonus: number;
}

export const GAME_MODES: Record<GameModeId, GameModeConfig> = {
  standard: {
    id: 'standard',
    labelKey: 'mode.standard',
    descriptionKey: 'mode.standardDesc',
    endlessWaves: false,
    bossEveryWave: false,
    waveScaleBonus: 1,
  },
  endless: {
    id: 'endless',
    labelKey: 'mode.endless',
    descriptionKey: 'mode.endlessDesc',
    endlessWaves: true,
    bossEveryWave: false,
    waveScaleBonus: 1.05,
  },
  boss_rush: {
    id: 'boss_rush',
    labelKey: 'mode.bossRush',
    descriptionKey: 'mode.bossRushDesc',
    endlessWaves: true,
    bossEveryWave: true,
    waveScaleBonus: 1.15,
  },
};

export function getGameModeConfig(mode: GameModeId): GameModeConfig {
  return GAME_MODES[mode] ?? GAME_MODES.standard;
}