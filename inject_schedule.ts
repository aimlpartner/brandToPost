import fs from 'fs';

let content = fs.readFileSync('src/pages/Schedule.tsx', 'utf8');
content = content.replace(
  "const res = await fetch(`/api/schedule/queue/${id}?productId=${activeProduct.id}`, { method: 'DELETE' });",
  "const token = await auth.currentUser?.getIdToken();\n    const res = await fetch(`/api/schedule/queue/${id}?productId=${activeProduct.id}`, { \n      method: 'DELETE',\n      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }\n    });"
);
fs.writeFileSync('src/pages/Schedule.tsx', content);
