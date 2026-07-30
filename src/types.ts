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
  targetPlatforms?: string[]; // E.g. ['linkedin', 'instagram', 'twitter', 'facebook', 'reddit']
  
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
  crawledUrls?: string[];

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
    targetIndustry?: string;
    targetAudience?: string;
    vision?: string;
    mission?: string;
    goal?: string;
    contentPillars?: string[];
  };

  // Founder Agent Automation & Approval Settings
  automationAgentEnabled?: boolean;
  automateDailyPosts?: boolean;
  automateDailyBlogs?: boolean;
  automateWeeklyCampaigns?: boolean;
  useBrandAssets?: boolean;
  automationTimeUtc?: string;
  automationWeeklyDay?: string;
  automationLogs?: Array<{ timestamp: string, type: string, theme: string, focus: string, status: string }>;
  requireEmailApproval?: boolean;
  autoUploadDelayHours?: number;

  // Script Studio persistent configuration
  narrativeVibe?: string;
  timingLimit?: string;
  productionFormat?: string;
  logoShowcase?: string;
  mascotShowcase?: string;
  mascotPreview?: string;
  activeScript?: ScriptData;
  scriptInstructions?: string;
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
  /** When true, imageUrl/imageId points to a fully composited JPEG with all overlays baked in */
  isFlattened?: boolean;
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
  visualType?: 'creative-story' | 'data-infographic' | 'powerful-quote' | 'abstract-announcement' | 'custom-overlay' | string;
  visualData?: {
    headline?: string;
    subtext?: string;
    stats?: Array<{ label: string; value: string }>;
    cinematicPrompt?: string;
    customHtml?: string;
    baseImage?: string;
    baseImageId?: string;
    layout?: any;
    editorState?: any;
    layoutId?: string;
    fonts?: { primary: string; secondary?: string };
  };
  layoutId?: string;
  /** When true, imageUrl/imageId points to a fully composited JPEG with all overlays baked in */
  isFlattened?: boolean;
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
  publishedBlogUrl?: string;
  publishedAt?: string;
  blogPublishError?: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  imageUrl?: string;
  imagePrompt?: string;
  summary?: string;
  tags?: string[];
  createdAt: string;
  publishedAt?: string | null;
  status: 'draft' | 'published';
  author?: string;
  productId?: string;
  campaignId?: string;
  targetAudience?: string;
  cta?: string;
}

export interface ApprovalRequest {
  id: string;
  token: string;
  userId?: string;
  productId: string;
  productName?: string;
  userEmail: string;
  itemType: 'campaign' | 'post' | 'blog' | 'founder_post';
  itemTitle: string;
  itemPreview?: string;
  itemData: any;
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  createdAt: string;
  expiresAt: string;
  processedAt?: string;
}

