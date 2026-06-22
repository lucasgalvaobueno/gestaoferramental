import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ijmaxyqcbeicxyqgsmpk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbWF4eXFjYmVpY3h5cWdzbXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTMwNzcsImV4cCI6MjA5NzcyOTA3N30.TYd2zKCM_xaQr7O3OnZNqijjrhyCQC3P3uPOQvsvGgA');

async function insertAdmin() {
    const newUser = {
        id: 'admin-seed-' + Date.now(),
        nome: 'Administrador',
        matricula: '00001',
        email: 'admin@sistema.com',
        senhahash: 'YWRtaW4xMjM=',
        cargo: 'Administrador de Sistema',
        nivel: 'admin',
        paineis: ["gestao-ferramental","manipulacao","compressao","embalagem","nao-solidos"],
        ativo: true,
        senhatemporaria: false
    };

    console.log("Tentando inserir...");
    const { data, error } = await supabase.from('usuarios').insert([newUser]);
    console.log("Error:", error);
    console.log("Data:", data);
}

insertAdmin();
