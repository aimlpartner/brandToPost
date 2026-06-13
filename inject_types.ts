import fs from 'fs';

let content = fs.readFileSync('src/types.ts', 'utf8');

const regex = /export interface DailyPost \{([\s\S]*?)\}/;

content = content.replace(regex, `export interface DailyPost {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  date?: string;
  contentType: string;
  platformVersions: PlatformPost[];
  imagePrompt?: string;
  imageUrl?: string;
  imageId?: string;
  overlayText?: string;
  visualType?: 'creative-story' | 'data-infographic' | 'powerful-quote' | 'abstract-announcement';
  visualData?: {
    headline?: string;
    subtext?: string;
    stats?: Array<{ label: string; value: string }>;
    cinematicPrompt?: string;
  };
}`);

fs.writeFileSync('src/types.ts', content);
