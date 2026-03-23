require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  try {
    const { data: expenses, error: eErr } = await supabase.from('expenses').select('*').limit(1);
    console.log('Expenses Columns:', expenses && expenses[0] ? Object.keys(expenses[0]) : 'No data or table missing');
    if (eErr) console.log('Expenses Error:', eErr);

    const { data: activity, error: aErr } = await supabase.from('activity_logs').select('*').limit(1);
    console.log('Activity Logs Table:', activity ? 'Exists' : 'Missing');
    if (aErr) console.log('Activity Error:', aErr.message);
  } catch (err) {
    console.error(err);
  }
}

check();
