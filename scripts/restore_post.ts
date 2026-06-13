import fs from 'fs';

let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf-8');


content = content.replace(
  'The Secret To Scale',
  'The Engine Under The Hood'
);

content = content.replace(
  'Meet Your <span className="text-transparent bg-clip-text bg-gradient-to-right from-[#7C3AED] via-[#FF7778] to-[#18F07A]">Autonomous Marketing</span> Department.',
  'Execute the <span className="text-transparent bg-clip-text bg-gradient-to-right from-[#7C3AED] via-[#FF7778] to-[#18F07A]">POST Framework</span> automatically.'
);

content = content.replace(
  "Tror is your Chief Marketing Officer. Under the hood, he manages a specialized team of 4 autonomous agents, each handling a specific piece of the marketing pipeline.",
  "We don't do random virality. Our entire agentic system is designed to execute the rigorous POST methodology proven by top B2B and Consumer brands."
);

content = content.replace(
  '{ l: "1", t: "The Strategist", d: "Scrapes your website, analyzes your product, and locks in your core DNA. Ensures every post aligns with your exact value proposition.",',
  '{ l: "P", t: "Position", d: "Solidify your narrative. We extract and lock your DNA so every generated output reinforces your actual value prop.",'
);

content = content.replace(
  '{ l: "2", t: "The Copywriter", d: "Crafts emotionally resonant, platform-native content. Knows the difference between a LinkedIn story and a short-form X thread.",',
  '{ l: "O", t: "Outreach", d: "Distribute natively. Tror understands constraints, formats uniquely for LinkedIn vs Twitter, and deploys contextually.",'
);

content = content.replace(
  '{ l: "3", t: "The Designer", d: "Pairs your copy with high-converting visual assets. Automatically generates graphics that match your brand identity.",',
  '{ l: "S", t: "Signal", d: "Inject visual trust. Our engine ties visual data and branding cues directly to the copy, asserting category leadership.",'
);

content = content.replace(
  '{ l: "4", t: "The Distributor", d: "Assembles the final assets, prepares the formats, and queues up your weekly schedule for 1-click approval.",',
  '{ l: "T", t: "Traction", d: "Publish automatically. Approve your scheduled week in 1 click and let BrandToPost turn attention into pipeline.",'
);

fs.writeFileSync('src/pages/LandingPage.tsx', content);
