const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://slufwfznzckuyiykmkvu.supabase.co';
const supabaseAnonKey = 'sb_publishable_uijY6z5oaE7tjGT4fG1adQ_qo-vktPS';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWrite() {
    console.log("Testing write to 'profiles'...");
    // We don't have a valid user ID, but we can try to select.
    // Actually, let's try to get the 'Service Name' or something public.

    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
        console.log("Read failed:", error.message);
    } else {
        console.log("Read success. Proceeding to test 'groups' specifically...");
        const { error: gErr } = await supabase.from('groups').select('*').limit(1);
        if (gErr) {
            console.log("Groups table check FAILED:", gErr.message);
        } else {
            console.log("Groups table check SUCCESS!");
        }
    }
}

testWrite();
