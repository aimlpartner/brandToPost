import fs from 'fs';

let content = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');

content = content.replace(
  /const res = await fetch\(`\/api\/schedule\?productId=\$\{activeProduct\.id\}`\);/,
  "const token = await user.getIdToken();\n        const res = await fetch(`/api/schedule?productId=${activeProduct.id}`, {\n          headers: {\n            'Authorization': `Bearer ${token}`\n          }\n        });"
);

content = content.replace(
  /}, \[activeProduct\]\);/,
  "}, [activeProduct, user]);"
);

content = content.replace(
  /if \(!activeProduct\) return;/,
  "if (!activeProduct || !user) return;"
);

fs.writeFileSync('src/pages/Campaigns.tsx', content);
