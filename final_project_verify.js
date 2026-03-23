const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://lacpfemvtuychruezjrn.supabase.co';
const supabaseAnonKey = 'sb_publishable_IFqP3CMyMY8jbibU9eaamA_494lDBS7';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    let report = "--- FINAL PROJECT VERIFICATION ---\n";
    report += `Project ID: lacpfemvtuychruezjrn\n`;
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
    fs.writeFileSync('final_project_report.txt', report, 'utf8');
}

checkSchema();
