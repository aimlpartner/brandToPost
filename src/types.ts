export interface VisualData {
  colors: string[];
  fonts: {
    primary: string;
    secondary: string;
  };
  typographyHierarchy: string;
  imageStyle: string;
}

export interface Scene {
  title: string;
  timing: string;
  activeCameraCue: string;
  dialog: string;
  videoPrompt: string;
  soundEffects: string;
  directingTip: string;
}

export interface ScriptData {
  title: string;
  gtmHook: string;
  coreMission: string;
  logoIdentityDna: string;
  mascotIdentityDna: string;
  primaryAudience: string;
  crownJewelProposition: string;
  centralAgitatedPain: string;
  calibratedToneAdjectives: string[];
  suggestedColors: { label: string; value: string }[];
  scenes: Scene[];
  visualStyleGuide: string;
  musicVibeGuide: string;
  requiredAssets?: { name: string; type: string; purpose: string; description: string }[];
}

export interface ProductDNA {
  id: string;
  userId?: string;
  name: string;
  website: string;
  description?: string;
  positioning: string;
  audience: string;
  tone: string;
  stage: string;
  visualStyle?: string;
  visualData?: VisualData;
  logoUrl?: string; // Kept for backwards compatibility
  logoDarkUrl?: string; // Used on light backgrounds
  logoLightUrl?: string; // Used on dark backgrounds
  
  // Advanced DNA (Psychographics & Strategy)
  enemy?: string;
  earnedSecret?: string;
  originStory?: string;
  hellState?: string;
  heavenState?: string;
  objections?: string;
  uniqueMechanism?: string;
  proofPoints?: string;
  vocabularyAlways?: string;
  vocabularyNever?: string;

  // New deeply strategic and actionable guidance
  contentPillars?: string[];
  targetIcps?: { name: string, painPoints: string[] }[];
  recommendedThemes?: string[];
  extractedMediaImages?: string[];

  // Founder Voice & Agent Doppelganger
  founderVoiceDescription?: string;
  founderVoiceFileName?: string;
  founderVoiceFileMimeType?: string;
  founderVoiceFileData?: string;
  founderAgentSynthesized?: {
    personaName: string;
    behavioralTraits: string[];
    communicationStyle: string[];
    coreValues: string[];
    decisionHeuristics: string[];
    synthesizedAt: string;
  };

  // Founder Agent Automation
  automationAgentEnabled?: boolean;
  automateDailyPosts?: boolean;
  automateDailyBlogs?: boolean;
  automateWeeklyCampaigns?: boolean;
  automationTimeUtc?: string;
  automationWeeklyDay?: string;
  automationLogs?: Array<{ timestamp: string, type: string, theme: string, focus: string, status: string }>;

  // Script Studio persistent configuration
  narrativeVibe?: string;
  timingLimit?: string;
  productionFormat?: string;
  logoShowcase?: string;
  mascotShowcase?: string;
  mascotPreview?: string;
  activeScript?: ScriptData;
}

export interface Creative {
  id: string;
  productId: string;
  url: string;
  name: string;
  createdAt: string;
}

export interface PlatformPost {
  platform: 'LinkedIn' | 'X' | 'Instagram' | 'Facebook' | 'Reddit';
  copy: string;
  format: string;
  imagePrompt?: string;
  imageUrl?: string;
  imageId?: string;
  improvedViaFeedback?: boolean;
  visualData?: any;
}

export interface DailyPost {
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
}

export interface Feedback {
  id: string;
  campaignId: string;
  postId: string;
  reviewerId: string;
  reviewerName: string;
  content: string;
  timestamp: string;
}

export interface WeeklyCampaign {
  id: string;
  userId?: string;
  productId: string;
  productName?: string;
  productLogoUrl?: string;
  isShared?: boolean;
  sharedAt?: string;
  feedbackExpiresAt?: string;
  feedbackProcessed?: boolean;
  startDate?: string;
  theme: string;
  targetAudience: string;
  coreMessage: string;
  hook: string;
  cta: string;
  contentFormat: string;
  platformVersions: PlatformPost[]; // Kept for backward compatibility
  dailyPosts?: DailyPost[];
  repurposingNotes: string;
  confidenceScore: number;
  pillar: string;
  researchSummary?: string;
  createdAt: string;
  focus?: string;
  subCategory?: string;
  campaignThemeInput?: string;
  tags?: string[];
  isOneDay?: boolean;
  isAutomated?: boolean;
  isBlog?: boolean;
  blogTitle?: string;
  blogContent?: string;
  blogImageUrl?: string;
  blogImagePrompt?: string;
}
