// src/app/pages/Dashboard/pages/posts/models/posts.ts

export enum InteractionType {
  Like = 1,
  Dislike = 2
}

// --- Shared Interfaces ---

export interface PostAttachment {
  id: number;
  url: string;
  type?: number;
}

export interface PostAuthor {
  id: number;
  username?: string;
  fullName?: string;
  name?: string; 
  imageUrl?: string;
  type?: number;
}

export interface PostStats {
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
}

export interface PostComment {
  id: number;
  content: string;
  author: PostAuthor | string;
  createdAt: string;
  replies?: PostComment[];
  isReplying?: boolean;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  category: number;
  createdAt: string;
  imageUrl?: string | null;
  lastUpdated?: string;
  sourceType?: number;
  postType?: number;
  tags?: string[];
  author?: PostAuthor | string;
  stats?: PostStats;
  comments?: PostComment[];
  attachments?: PostAttachment[];
  currentUserInteraction?: InteractionType | null; 
  userInteraction?: InteractionType | null;
}

export interface InterestGroup {
  category: number;
  posts: Post[];
}

// ✅ تعديل هنا: إضافة ID وحقول الحالة للواجهة
export interface CommunitySuggestion {
  id: number;          // ضروري لعمل Join
  name: string;
  slug: string;
  memberCount?: number; // لعرض عدد الأعضاء
  
  // UI States
  isJoined?: boolean;
  isLoadingJoin?: boolean;
}

export interface FeedData {
  featuredPosts: Post[];
  interestGroups: InterestGroup[];
  discoveryPosts: Post[];
  suggestedCommunities: CommunitySuggestion[];
  trendingTags: string[];
}

export type TagPostsResponse = Post[];

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  error: { code: string; message: string } | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}