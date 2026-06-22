import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rtbewwsbwubqfvvpfzfc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0YmV3d3Nid3VicWZ2dnBmemZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNjAzNzYsImV4cCI6MjA5NzczNjM3Nn0.qiTJAuyHaNqgfhzNCy_b3l0Ab0XL9wQx0XHsdIhQNb8');

const encode = (str) => {
    try { return btoa(unescape(encodeURIComponent(str))); }
    catch { return btoa(str); }
};

async function testLogin(email, senha) {
    const { data, error } = await supabase.from('usuarios')
        .select('*')
        .ilike('email', email.trim())
        .single();

    if (error || !data) {
        console.log("Erro: Usuário não encontrado ou erro de banco");
        return;
    }

    if (data.senhahash !== encode(senha)) {
        console.log(`Erro: Senha inválida. Banco=${data.senhahash}, Digitou=${encode(senha)}`);
        return;
    }

    console.log("Login OK!", data.nome);
}

testLogin('admin@sistema.com', 'admin123');
testLogin('admin@sistema.com', 'senha1234');
