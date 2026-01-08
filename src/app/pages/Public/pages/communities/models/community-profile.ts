export interface CommunityDetails {
  id: number;
  name: string;
  slug: string;
  description: string;
  type: number; // 9 might allow requests logic if needed
  imageUrl: string; 
  coverUrl: string; 
  memberCount: number;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: string | { name: string; imageUrl?: string };
  attachments: { id: number; url: string }[];
  stats: { likes: number; comments: number; shares: number; };
}

export interface CommunityMember {
  userId: number;
  name: string;
  avatarUrl: string | null;
  role: string;
  joinedAt: string;
}

// Updated based on your JSON Response
export interface CommunityProfileData {
  community: CommunityDetails;
  posts: {
    isSuccess: boolean;
    data: Post[];
    totalCount: number;
  } | null;
  ownerId: number; // 🔥 Important for permission logic
  memberRole: string | null;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  error: any;
}