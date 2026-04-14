export interface VisualData {
  colors: string[];
  fonts: {
    primary: string;
    secondary: string;
  };
  typographyHierarchy: string;
  imageStyle: string;
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
  logoUrl?: string;
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
}
