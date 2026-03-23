const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://slufwfznzckuyiykmkvu.supabase.co';
const supabaseAnonKey = 'sb_publishable_uijY6z5oaE7tjGT4fG1adQ_qo-vktPS';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    let report = "--- RE-VERIFICATION ATTEMPT ---\n";
    report += `Time: ${new Date().toISOString()}\n`;

    const tables = ['groups', 'expenses', 'expense_splits', 'profiles'];

    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                report += `[FAIL] ${table}: ${error.code} - ${error.message}\n`;
            } else {
                report += `[PASS] ${table} exists.\n`;
                if (table === 'expenses') {
                    const { error: colErr } = await supabase.from(table).select('title').limit(1);
                    if (colErr) report += `       [ERROR] 'title' column missing\n`;
                    else report += `       [OK] 'title' column found\n`;
                }
            }
        } catch (e) {
            report += `[EXCP] ${table}: ${e.message}\n`;
        }
    }
    fs.writeFileSync('re_verify_report.txt', report, 'utf8');
    console.log("Report written to re_verify_report.txt");
}

checkSchema();
