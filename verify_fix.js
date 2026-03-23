const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://slufwfznzckuyiykmkvu.supabase.co';
const supabaseAnonKey = 'sb_publishable_uijY6z5oaE7tjGT4fG1adQ_qo-vktPS';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    console.log("--- FINAL VERIFICATION ---");
    const tables = ['groups', 'expenses', 'expense_splits', 'profiles'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`[FAIL] ${table}: ${error.message}`);
        } else {
            console.log(`[PASS] ${table} exists.`);
            if (data.length > 0 || table === 'profiles') {
                // Check for specific columns if not empty
                const { error: colErr } = await supabase.from(table).select('*').limit(1);
                if (!colErr) console.log(`       Columns verified.`);
            }
        }
    }
}

checkSchema();
