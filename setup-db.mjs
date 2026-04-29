import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co';
const serviceKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

// Try to create tables using PostgREST
async function setupDatabase() {
  
  const tables = [
    {
      name: 'profiles',
      data: { id: '__init__', username: '__init__', email: null, avatar_id: 'default', is_guest: true, level: 1, xp: 0, crystals: 0 }
    },
    {
      name: 'user_stats',
      data: { profile_id: '__init__', total_playtime: 0, total_kills: 0, total_score: 0, highest_wave: 0, games_played: 0, bugs_smashed: 0, enemies_killed: 0, powerups_collected: 0, upgrades_purchased: 0, achievements_unlocked: [], current_streak: 0, longest_streak: 0 }
    },
    {
      name: 'user_settings',
      data: { profile_id: '__init__', sound_volume: 0.8, music_volume: 0.6, graphics_quality: 'medium', haptics_enabled: true, show_damage_numbers: true, show_fps: false, difficulty: 'normal' }
    },
    {
      name: 'game_saves',
      data: { profile_id: '__init__', game_state: {}, version: '1.4.0' }
    },
    {
      name: 'leaderboard',
      data: { profile_id: '__init__', score: 0, wave: 0 }
    }
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table.name).upsert(table.data, { onConflict: 'id' });
      if (error) {
        if (error.message.includes('does not exist') || error.code === 'PGRST116') {
          console.log(`Table ${table.name}: needs creation`);
        } else if (error.message.includes('schema')) {
          console.log(`Table ${table.name}: schema issue - ${error.message}`);
        } else {
          console.log(`Table ${table.name}: ${error.message}`);
        }
      } else {
        console.log(`Table ${table.name}: OK`);
      }
    } catch (e) {
      console.log(`Table ${table.name}: ${e.message}`);
    }
  }
}

setupDatabase();