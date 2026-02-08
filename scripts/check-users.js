const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://qvjsfovxdicgyzpwgzgc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2anNmb3Z4ZGljZ3l6cHdnemdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ3MDcyMCwiZXhwIjoyMDg2MDQ2NzIwfQ.TeWN1XEbNnZwbJygAUP4mcw8QywC7YqDZ-cohlUsnpE'
);

async function check() {
  // Check users table
  const { data: users, error } = await supabase.from('users').select('*');
  console.log('=== USERS TABLE ===');
  if (error) {
    console.log('Error:', error.message);
  } else if (!users || users.length === 0) {
    console.log('No users found');
  } else {
    users.forEach(u => {
      console.log('User ID:      ' + u.user_id);
      console.log('Display Name: ' + u.display_name);
      console.log('Email:        ' + u.email);
      console.log('Avatar:       ' + (u.avatar_url ? 'Yes' : 'No'));
      console.log('Last Sign In: ' + u.last_sign_in);
      console.log('');
    });
  }

  // Check leaderboard for updated display names
  const { data: lb } = await supabase.from('leaderboard').select('user_id, display_name').limit(5);
  console.log('=== LEADERBOARD DISPLAY NAMES ===');
  if (lb && lb.length > 0) {
    lb.forEach(e => {
      console.log(e.user_id.substring(0, 15) + '... => ' + e.display_name);
    });
  } else {
    console.log('No leaderboard entries');
  }
}

check();
