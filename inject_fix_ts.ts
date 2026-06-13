import fs from 'fs';

let content = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');

// There are two setPreviewPost matches with (typeof dp !== 'undefined' ? dp.visualType : undefined)
// In the global platformVersions loop, let's just use (pv as any).visualType

content = content.replace(
  /onClick=\{[^{]*?setPreviewPost\(\{\s*platform: pv\.platform,\s*copy: pv\.copy,\s*imageUrl: pv\.imageUrl[^{]*?campaignImages\[pv\.imageId\] : undefined\),\s*visualType: \(pv as any\)\.visualType \|\| \(typeof dp !== 'undefined' \? dp\.visualType : undefined\),\s*visualData: \(pv as any\)\.visualData \|\| \(typeof dp !== 'undefined' \? dp\.visualData : undefined\)\s*\}\)\}[\s\S]*?Eye className="h-3\.5/g,
  (match) => {
    // If we're around line 1490 (where it breaks), we replace the dp completely
    if (match.includes("pv.platform") && (!content.substring(content.indexOf(match) - 500, content.indexOf(match)).includes("campaign.dailyPosts?.map"))) {
       // but wait, both of them are pv.platform...
       return match;
    }
    return match;
  }
);

// Actually, simpler: search and replace the second occurrence explicitly
const parts = content.split("Eye className=\"h-3.5");
if (parts.length > 2) {
  // parts[1] contains the end of the second setPreviewPost
  parts[1] = parts[1].replace(/\|\| \(typeof dp !== 'undefined' \? dp\.visualType : undefined\)/g, "");
  parts[1] = parts[1].replace(/\|\| \(typeof dp !== 'undefined' \? dp\.visualData : undefined\)/g, "");
  
  content = parts.join("Eye className=\"h-3.5");
}

fs.writeFileSync('src/pages/Campaigns.tsx', content);

