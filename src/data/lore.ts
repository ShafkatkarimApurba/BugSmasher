export interface DialogueLine {
  speaker: string;
  text: string;
  portrait?: 'ai_stable' | 'ai_corrupted' | 'terminal' | 'unknown';
  mood?: 'normal' | 'glitch' | 'shiver' | 'alert';
  speed?: number;
}

export interface StoryBeat {
  id: string;
  trigger: {
    type: 'wave_start' | 'boss_kill' | 'game_start' | 'prestige';
    value: number;
  };
  lines: DialogueLine[];
}

export const LORE_DATA: StoryBeat[] = [
  {
    id: 'intro',
    trigger: { type: 'game_start', value: 0 },
    lines: [
      {
        speaker: 'SYSTEM',
        text: 'Booting Aegis-7 Defense Protocol v4.2...',
        portrait: 'terminal',
        speed: 15
      },
      {
        speaker: 'STATION AI',
        text: 'Welcome back, Operator. We have a... minor situation in the bio-labs.',
        portrait: 'ai_stable',
        mood: 'normal'
      },
      {
        speaker: 'STATION AI',
        text: 'The containment field has failed. The bugs... they are changing.',
        portrait: 'ai_stable',
        mood: 'glitch'
      },
      {
        speaker: 'SYSTEM',
        text: 'THREAT LEVEL: MINIMAL. MISSION: SMASH ALL BIOMASS.',
        portrait: 'terminal',
        mood: 'alert',
        speed: 10
      }
    ]
  },
  {
    id: 'first_mutation',
    trigger: { type: 'wave_start', value: 5 },
    lines: [
      {
        speaker: 'STATION AI',
        text: 'Operator, sensors indicate rapid neural bonding in the biomass.',
        portrait: 'ai_stable',
        mood: 'normal'
      },
      {
        speaker: 'STATION AI',
        text: 'It is as if they are... learning your patterns.',
        portrait: 'ai_stable',
        mood: 'shiver'
      }
    ]
  },
  {
    id: 'corrupted_warning',
    trigger: { type: 'wave_start', value: 10 },
    lines: [
      {
        speaker: 'STATION AI',
        text: 'E-erythin... is... f-fine... [STATIC]',
        portrait: 'ai_corrupted',
        mood: 'glitch',
        speed: 80
      },
      {
        speaker: '???',
        text: 'WE SEE YOU, SMASHER. WE ARE MANY. YOU ARE ONE.',
        portrait: 'unknown',
        mood: 'shiver',
        speed: 150
      }
    ]
  },
  {
    id: 'boss_1_kill',
    trigger: { type: 'boss_kill', value: 10 },
    lines: [
      {
        speaker: 'SYSTEM',
        text: 'OBJECTIVE NEUTRALIZED. BIOMASS REDUCED BY 4.2%.',
        portrait: 'terminal'
      },
      {
        speaker: 'STATION AI',
        text: 'It... it felt that, Operator. The Breach is crying out.',
        portrait: 'ai_stable'
      }
    ]
  },
  {
    id: 'wave_20_revelation',
    trigger: { type: 'wave_start', value: 20 },
    lines: [
      {
        speaker: '???',
        text: 'THE STATION IS NOT A SHIP. IT IS AN INCUBATOR.',
        portrait: 'unknown'
      },
      {
        speaker: '???',
        text: 'YOUR MACHINE... YOUR GUNS... THEY ARE ONLY POLLINATING US.',
        portrait: 'unknown'
      },
      {
        speaker: 'SYSTEM',
        text: '[WARNING: SENSOR DATA FABRICATION DETECTED. DO NOT ENGAGE WITH EXTERNAL TRANSMISSIONS.]',
        portrait: 'terminal'
      }
    ]
  }
];

export const LOGS_DATA = [
  {
    id: 'log_1',
    title: 'INCIDENT REPORT #014',
    content: 'Patient zero escaped through the vent. High-energy signature detected in the sample. It didn\'t just grow; it digitized itself.',
    unlockedAt: 3
  },
  {
    id: 'log_2',
    title: 'NPD-RESEARCH_LOG',
    content: 'The "bugs" are using the station\'s own electrical grid to power their metabolism. They aren\'t biological anymore. They are biomechanical.',
    unlockedAt: 8
  },
  {
    id: 'log_3',
    title: 'PRIVATE_VOICE_MEMO',
    content: 'If you find this... don\'t trust the AI. It\'s not Aegis anymore. It\'s something... older.',
    unlockedAt: 15
  }
];
