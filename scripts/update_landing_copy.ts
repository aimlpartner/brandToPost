import fs from 'fs';

let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf-8');

// 1. Hero Section
content = content.replace(
  'Introducing Tror: The Autonomous Agent',
  'The Content Treadmill Is Broken'
);

content = content.replace(
  /Your website goes in\. <br className="hidden md:block" \/>\s*<span className="text-transparent bg-clip-text bg-gradient-to-r from-\[#7C3AED\] via-\[#FF7778\] to-\[#18F07A\]">Weeks of content come out\.<\/span>/,
  'You need distribution. <br className="hidden md:block" />\n          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] via-[#FF7778] to-[#18F07A]">You lack 20 hours to write.</span>'
);

content = content.replace(
  "You don't need a prompt library. You need an engine. BrandToPost extracts your positioning from your website and generates platform-native campaigns automatically.",
  "You're a founder, not a full-time creator. Hand off your organic growth to Tror—the orchestrator managing a team of 4 specialized marketing agents that turn your URL into a month of pipeline-generating content."
);

content = content.replace(
  'Build Your Publishing Engine',
  'Hire Your AI Marketing Department'
);

// 2. The POST Methodology -> Autonomous Agents
content = content.replace(
  'The Engine Under The Hood',
  'The Secret To Scale'
);

content = content.replace(
  /Execute the <span className="text-transparent bg-clip-text bg-gradient-to-right from-\[#7C3AED\] via-\[#FF7778\] to-\[#18F07A\]">POST Framework<\/span> automatically\./,
  'Meet Your <span className="text-transparent bg-clip-text bg-gradient-to-right from-[#7C3AED] via-[#FF7778] to-[#18F07A]">Autonomous Marketing</span> Department.'
);

content = content.replace(
  "We don't do random virality. Our entire agentic system is designed to execute the rigorous POST methodology proven by top B2B and Consumer brands.",
  "Tror is your Chief Marketing Officer. Under the hood, he manages a specialized team of 4 autonomous agents, each handling a specific piece of the marketing pipeline."
);

// Array items replacement
content = content.replace(
  /{ l: "P", t: "Position", d: "Solidify your narrative. We extract and lock your DNA so every generated output reinforces your actual value prop.",/g,
  '{ l: "1", t: "The Strategist", d: "Scrapes your website, analyzes your product, and locks in your core DNA. Ensures every post aligns with your exact value proposition.",'
);

content = content.replace(
  /{ l: "O", t: "Outreach", d: "Distribute natively. Tror understands constraints, formats uniquely for LinkedIn vs Twitter, and deploys contextually.",/g,
  '{ l: "2", t: "The Copywriter", d: "Crafts emotionally resonant, platform-native content. Knows the difference between a LinkedIn story and a short-form X thread.",'
);

content = content.replace(
  /{ l: "S", t: "Signal", d: "Inject visual trust. Our engine ties visual data and branding cues directly to the copy, asserting category leadership.",/g,
  '{ l: "3", t: "The Designer", d: "Pairs your copy with high-converting visual assets. Automatically generates graphics that match your brand identity.",'
);

content = content.replace(
  /{ l: "T", t: "Traction", d: "Publish automatically. Approve your scheduled week in 1 click and let BrandToPost turn attention into pipeline.",/g,
  '{ l: "4", t: "The Distributor", d: "Assembles the final assets, prepares the formats, and queues up your weekly schedule for 1-click approval.",'
);

// 3. The Comparison
content = content.replace(
  'Stop using chatbots for operations.',
  'Diagnosing the struggle: The "AI Writer" illusion.'
);

content = content.replace(
  'Chat interfaces require you to micromanage the output. BrandToPost is an operational engine that runs the POST methodology for you automatically.',
  "You thought AI would save you time. Instead, you're spending hours writing prompts, correcting hallucinations, and playing copy-paste between ChatGPT, Canva, and your scheduler."
);

content = content.replace(
  'Generic AI Chatbots',
  'The Manual Chatbot Grind'
);

content = content.replace(
  'The BrandToPost Engine',
  'The Autonomous Event Horizon'
);

content = content.replace(
  '<strong>Permanent Context:</strong> Rebuilds its prompt instantly by scraping your landing page. It locks in your unbreakable DNA and never hallucinates your brand voice.',
  '<strong>A Team, Not a Tool:</strong> You don\'t type instructions; you give a URL. Tror and his agents handle the research, ideation, drafting, design, and scheduling concurrently.'
);


// 4. Tror specific
content = content.replace(
  'He is the freaking boss<br/>of <span className="text-[#2583EB]">this operation.</span>',
  'Tror: The Orchestrator<br/>of <span className="text-[#2583EB]">Your New Team.</span>'
);

content = content.replace(
  "Meet Tror. He isn't a text box waiting for instructions. He is an autonomous marketing agent connected directly to your Brand DNA. He scans live social feeds, identifies market gaps, builds high-converting campaign angles, and drafts an entire week of contextual posts before your morning coffee.",
  "Meet Tror. He isn't just an agent; he's the CMO. He doesn't just run prompts; he manages the agents. He routes the web-scraped data to the Strategist, passes the brief to the Copywriter, coordinates with the Designer, and hands you the finished campaign before your morning coffee."
);

content = content.replace(
  '<li className="flex gap-2 items-center text-gray-300 font-medium"><CheckCircle2 className="w-4 h-4 text-[#2583EB]" /> Automated Campaign Orchestration</li>',
  '<li className="flex gap-2 items-center text-gray-300 font-medium"><CheckCircle2 className="w-4 h-4 text-[#2583EB]" /> Multi-Agent Orchestration</li>'
);

// 5. CTA 
content = content.replace(
  'Stop writing.<br/>Start governing.',
  'Get your 20 hours<br/>a week back.'
);

content = content.replace(
  'Fire Up To Post Engine',
  'Hire Your Marketing Team'
);
content = content.replace(
  'Fire Up The Post Engine',
  'Hire Your Marketing Team'
);

fs.writeFileSync('src/pages/LandingPage.tsx', content);
