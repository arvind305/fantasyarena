require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', 'ui', '.env') });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

(async () => {
  const ids = [
    '1c75176d-3750-4628-adf5-6f6065d6fb93', // Travis Head
    '2abe4511-befd-4497-94e7-6a680d69e703', // Josh Inglis
    '147047d1-0717-471e-9329-0b916344d0ce', // Adam Zampa
    'fc46c6f8-8459-4634-8ce5-896688ae3d73', // Marcus Stoinis
    '22c9211a-456d-4991-885f-d9894900f8de', // Sikandar Raza
    'b30f4347-3e41-4fad-a42f-0b3cc459f491', // Blessing Muzarabani
    'fdc8b163-b813-42d0-b2cf-62691728495b', // Brendan Taylor
    '03649be4-88cd-48ae-89bc-a203a300cb2a', // Mitchell Marsh
    'e84de3e5-9e07-41df-bb51-0c7b0334a1f7', // Brian Bennett
    '3dc3ec22-0a64-41ed-bb34-7b8da88dc3f2', // Ryan Burl
    'd5e5b7cc-fe74-42b2-b6fd-a01c2c20fb14', // Glenn Maxwell
  ];
  const { data, error } = await sb.from('players').select('player_id,player_name,squad_id').in('player_id', ids);
  if (error) console.log('Error:', error.message);
  console.log('Found', (data || []).length, 'of', ids.length);
  (data || []).forEach(p => console.log('  FOUND:', p.player_id.slice(0, 8), p.player_name));
  const found = new Set((data || []).map(p => p.player_id));
  ids.forEach(id => {
    if (!found.has(id)) console.log('  MISSING:', id);
  });
})();
