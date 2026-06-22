import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rtbewwsbwubqfvvpfzfc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0YmV3d3Nid3VicWZ2dnBmemZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNjAzNzYsImV4cCI6MjA5NzczNjM3Nn0.qiTJAuyHaNqgfhzNCy_b3l0Ab0XL9wQx0XHsdIhQNb8');

async function testQuery() {
    console.log("Consultando o banco...");
    const { data, error } = await supabase.from('usuarios').select('*');
    console.log("Error:", error);
    console.log("Data:", data);
}

testQuery();
