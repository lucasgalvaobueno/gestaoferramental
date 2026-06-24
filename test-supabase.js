const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const code = fs.readFileSync('./src/lib/supabase.js', 'utf8');
const urlMatch = code.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = code.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);
if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  supabase.rpc('get_tables').then(console.log).catch(console.error);
  supabase.from('usuarios').select('*').limit(1).then(console.log);
}
