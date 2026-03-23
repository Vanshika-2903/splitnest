const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://slufwfznzckuyiykmkvu.supabase.co';
const supabaseAnonKey = 'sb_publishable_uijY6z5oaE7tjGT4fG1adQ_qo-vktPS';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    let output = `Checking Supabase URL: ${supabaseUrl}\n`;

    const tables = ['groups', 'expenses', 'expense_splits', 'profiles'];

    for (const table of tables) {
        try {
            // Try to get a sample or use a query that reveals columns even if empty
            // In Postgres, we can query information_schema if we had direct access, 
            // but through Postgrest we can try a select * on an empty table and check headers or similar.
            // Actually, selecting a non-existent column is a good way to see error messages.

            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                output += `Table '${table}' error: ${error.message}\n`;
            } else {
                output += `Table '${table}' exists. Found ${data.length} row(s).\n`;
                // Since it might be empty, we can try to insert a dummy row or just use the error approach.
                // Let's try to select a known column from SplitNest and see if it fails.
                const testCols = ['amount', 'title', 'paid_by', 'group_id'];
                for (const col of testCols) {
                    const { error: colErr } = await supabase.from(table).select(col).limit(1);
                    if (colErr) {
                        output += `  Column '${col}' missing in ${table}: ${colErr.message}\n`;
                    } else {
                        output += `  Column '${col}' exists in ${table}\n`;
                    }
                }
            }
        } catch (e) {
            output += `Table '${table}' exception: ${e.message}\n`;
        }
    }
    fs.writeFileSync('diag_output.txt', output);
}

checkSchema();
