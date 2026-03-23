const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lacpfemvtuychruezjrn.supabase.co';
const supabaseAnonKey = 'sb_publishable_IFqP3CMyMY8jbibU9eaamA_494lDBS7';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    console.log("--- DATA CHECK ---");
    const tables = ['profiles', 'groups', 'group_members', 'expenses', 'expense_splits'];

    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`[ERROR] ${table}: ${error.message}`);
        } else {
            console.log(`[OK] ${table} count: ${count}`);
        }
    }
}

checkData();
