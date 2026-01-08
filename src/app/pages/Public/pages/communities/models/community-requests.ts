// src/app/pages/Public/pages/communities/models/community-requests.models.ts

export interface CommunityRequestDto {
  userId: number;
  userName: string;
  userAvatar: string;
  requestedAt: string;
}

export interface RequestApiResponse<T> {
  isSuccess: boolean;
  data: T;
  error: { code: string; message: string } | null;
}