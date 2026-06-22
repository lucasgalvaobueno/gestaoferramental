import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ijmaxyqcbeicxyqgsmpk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbWF4eXFjYmVpY3h5cWdzbXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTMwNzcsImV4cCI6MjA5NzcyOTA3N30.TYd2zKCM_xaQr7O3OnZNqijjrhyCQC3P3uPOQvsvGgA');

async function checkAdmin() {
    console.log("Consultando Supabase...");
    const { data, error } = await supabase.from('usuarios').select('*');
    if (error) {
        console.error("Erro na consulta:", error);
    } else {
        console.log("Usuários no banco:", data);
    }
}

checkAdmin();
