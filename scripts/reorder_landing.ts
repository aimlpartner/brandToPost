import fs from 'fs';

let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf-8');

const metricsSec = content.match(/{\/\* Metrics Strip \*\/}.*?<\/section>/s);
const differenceSec = content.match(/{\/\* The Difference \(Comparison\) \*\/}.*?<\/section>\s*/s);
const postSec = content.match(/{\/\* POST Methodology \*\/}.*?<\/section>\s*/s);
const feature1Sec = content.match(/{\/\* Feature 1: DNA Profiling UI \*\/}.*?<\/section>\s*/s);
const deepDiveSec = content.match(/{\/\* Deep Dive: The Output \*\/}.*?<\/section>\s*/s);
const feature2Sec = content.match(/{\/\* Feature 2: Tror Generation - REDESIGNED \*\/}.*?<\/section>\s*/s);
const agentsSec = content.match(/{\/\* Visual Agents Architecture \*\/}.*?<\/section>\s*/s);
const ctaSec = content.match(/{\/\* CTA Section \*\/}.*?<\/section>\s*/s);

if (metricsSec && differenceSec && postSec && feature1Sec && deepDiveSec && feature2Sec && agentsSec && ctaSec) {
  const heroEnd = content.indexOf('{/* Metrics Strip */}');
  
  if (heroEnd > -1) {
    const prefix = content.slice(0, heroEnd);
    
    const suffixIndex = content.indexOf('</section>', content.indexOf('{/* CTA Section */}')) + 10;
    const suffix = content.slice(suffixIndex);
    
    // Ordered sequence
    const newContent = prefix + 
      metricsSec[0] + '\n\n' +
      differenceSec[0] + '\n\n' +
      postSec[0] + '\n\n' +
      deepDiveSec[0] + '\n\n' +
      agentsSec[0] + '\n\n' +
      feature2Sec[0] + '\n\n' +
      ctaSec[0] + 
      suffix;
      
    fs.writeFileSync('src/pages/LandingPage.tsx', newContent);
    console.log("Successfully reordered sections cleanly.");
  }
} else {
  console.log("Missing sections.");
}
