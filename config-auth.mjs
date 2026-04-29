import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co';
const serviceKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, serviceKey);

async function configureAuth() {
  console.log('⚙️ Configuring Supabase Auth...\n');
  
  console.log('Checking auth configuration...');
  
  // Try to access the auth config via the admin API
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      }
    });
    
    if (response.ok) {
      const settings = await response.json();
      console.log('Current settings:', JSON.stringify(settings, null, 2));
    } else {
      console.log('Settings response:', response.status, await response.text());
    }
  } catch (e) {
    console.log('Could not fetch settings:', e.message);
  }
  
  // Try to create a user directly via admin API
  console.log('\n📝 Creating user via admin API...');
  
  const testUser = {
    email: 'player1@bugsmasher.game',
    password: 'GamePassword123!',
    email_confirm: true,
    user_metadata: { username: 'PlayerOne' }
  };
  
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const result = await response.json();
    console.log('Admin create response:', response.status);
    console.log(JSON.stringify(result, null, 2));
    
    if (result.id) {
      console.log('\n✅ User created! ID:', result.id);
      
      // Add to profiles table
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: result.id,
        username: 'PlayerOne',
        email: testUser.email,
        avatar_id: 'default',
        is_guest: false,
        level: 1,
        xp: 0,
        crystals: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      
      if (profileError) {
        console.log('Profile error:', profileError.message);
      } else {
        console.log('✅ Profile created!');
      }
      
      // Add stats
      await supabase.from('user_stats').upsert({
        profile_id: result.id,
        total_playtime: 0,
        total_kills: 0,
        total_score: 0,
        highest_wave: 0,
        games_played: 0,
      }, { onConflict: 'profile_id' });
      
      // Add to leaderboard
      await supabase.from('leaderboard').upsert({
        profile_id: result.id,
        score: 0,
        wave: 0,
      }, { onConflict: 'profile_id' });
    }
  } catch (e) {
    console.log('Error creating user:', e.message);
  }
  
  console.log('\n✅ Configuration complete!');
}

configureAuth().then(() => process.exit(0)).catch(e => {
  console.log('Error:', e.message);
  process.exit(1);
});