const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://slufwfznzckuyiykmkvu.supabase.co';
const supabaseAnonKey = 'sb_publishable_uijY6z5oaE7tjGT4fG1adQ_qo-vktPS';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    let report = "--- DETAILED VERIFICATION ---\n";
    const tables = ['groups', 'expenses', 'expense_splits', 'profiles'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            report += `[FAIL] ${table}: ${error.message}\n`;
        } else {
            report += `[PASS] ${table} exists.\n`;
            // Check for 'title' in expenses
            if (table === 'expenses') {
                const { error: colErr } = await supabase.from(table).select('title').limit(1);
                if (colErr) {
                    report += `       [ERROR] 'title' column missing (OLD SCHEMA detected!)\n`;
                } else {
                    report += `       [OK] 'title' column found (NEW SCHEMA verified!)\n`;
                }
            }
        }
    }
    fs.writeFileSync('final_report_utf8.txt', report, 'utf8');
}

checkSchema();
