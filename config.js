// Настройки кабинета «9×16 peržiūra» на GitHub Pages. Подробно — tools/kabinetas/DEPLOY.md, шаг 3.
// supabaseUrl — адрес проекта «9x16» (Supabase → Project Settings → API → Project URL).
// supabaseKey — открытый ключ anon / publishable (там же). Он не секрет: таблицы закрыты, работают только функции kab_*.
// Ключ service_role, пароли и токены сюда не класть никогда.
// Пока стоят заглушки PROJEKTAS / PAKEISTI, страница честно пишет «Puslapis dar neparuoštas».
window.KABINETAS = {
  backend: 'supabase',
  supabaseUrl: 'https://unqigjclaussgwpifgcx.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVucWlnamNsYXVzc2d3cGlmZ2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0ODAzNDIsImV4cCI6MjA4ODA1NjM0Mn0.XcUMLcj0ONNKeWfYqvhaHkj8wYwOPrsGuQyoath26I8',
  pollMs: 20000,
  lang: 'lt'
};
