import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink, NavigationEnd, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { ProfileService } from '../service/profile';
import { AuthService } from '../../../../Authentication/Service/auth';
import { UserProfileData, SocialPlatform } from '../models/profile';
import { Post, InteractionType, PostComment } from '../../posts/models/posts';
import { ToastService } from '../../../../../shared/services/toast.service';
import { PostsService } from '../../posts/services/posts';
import { CATEGORY_LIST } from '../../../../models/category-list';

export interface DashboardCard {
  type: string;
  status: string;
  title: string;
  sub: string;
  detail: string;
  action: string;
  isEvent?: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  providers: [DatePipe],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit {

  protected readonly environment = environment;
  protected readonly InteractionType = InteractionType;

  private profileService = inject(ProfileService);
  private postsService = inject(PostsService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private datePipe = inject(DatePipe);
  private zone = inject(NgZone);
  private toastService = inject(ToastService);

  // --- State ---
  user: UserProfileData | null = null;
  savedPosts: Post[] = [];
  currentUsername: string = '';
  currentUserId: string | null = null;

  isLoading = true;
  isSavedLoading = false;
  isOwner = false;
  activeTab = 'posts';

  // --- Interaction State ---
  activeReplyId: number | null = null;
  replyInputs: { [key: number]: string } = {};
  showShareModal = false;
  shareCommentary = '';
  isSharing = false;
  sharingPostId: number | null = null;
  categories = CATEGORY_LIST;

  // UI Data
  socialPlatforms = [
    { id: SocialPlatform.Facebook, name: 'Facebook', icon: 'bi-facebook' },
    { id: SocialPlatform.Twitter, name: 'Twitter', icon: 'bi-twitter-x' },
    { id: SocialPlatform.LinkedIn, name: 'LinkedIn', icon: 'bi-linkedin' },
    { id: SocialPlatform.Github, name: 'Github', icon: 'bi-github' },
    { id: SocialPlatform.Website, name: 'Website', icon: 'bi-globe' },
    { id: SocialPlatform.Other, name: 'Other', icon: 'bi-link-45deg' }
  ];

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserId = user.id || (user as any).userId;
      }
    });

    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      this.resolveIdentityAndLoad(username);
    });
  }

  resolveIdentityAndLoad(routeUsername: string | null) {
    const currentUser = this.authService.currentUser$.value;
    let targetUsername = routeUsername;

    if (!targetUsername && currentUser) {
      targetUsername = currentUser.username;
    }

    this.isOwner = !!(currentUser && targetUsername && currentUser.username?.toLowerCase() === targetUsername.toLowerCase());
    this.currentUsername = targetUsername || '';

    if (this.currentUsername) {
      this.loadProfile(this.currentUsername);
    } else {
      this.zone.run(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  loadProfile(username: string) {
    this.isLoading = true;
    this.profileService.getProfile(username).subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.isLoading = false;
          if (res.isSuccess && res.data) {
            this.user = res.data;
            if (this.user.recentPosts) {
              this.user.recentPosts = (this.user.recentPosts as any[]).map(p => this.normalizePostData(p)) as any;
            }
            this.initBasicInfo();
          }
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  normalizePostData(post: Post): Post {
    if (!post.stats) post.stats = { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0 };
    if (post.currentUserInteraction !== undefined) post.userInteraction = post.currentUserInteraction;
    (post as any).showComments = false;
    (post as any).newCommentContent = '';
    return post;
  }

  switchTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'saved' && this.isOwner) this.loadSavedPosts();
    if (tab === 'manage' && this.isOwner) this.initBasicInfo();
  }

  loadSavedPosts() {
    this.isSavedLoading = true;
    this.profileService.getSavedPosts().subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.isSavedLoading = false;
          if (res.isSuccess) {
            this.savedPosts = (res.data || []).map((p: any) => this.normalizePostData(p));
          }
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.isSavedLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  // --- Interaction Logic ---

  toggleInteraction(post: any, type: InteractionType, event?: Event) {
    if (event) event.stopPropagation();
    if (!this.currentUserId) {
      this.toastService.warning('Please login to interact with posts.');
      return;
    }

    const oldInteraction = post.userInteraction;

    if (post.userInteraction === type) {
      post.userInteraction = null;
      if (post.stats) {
        if (type === InteractionType.Like) post.stats.likes--;
        else post.stats.dislikes--;
      }
    } else {
      if (post.stats) {
        if (post.userInteraction === InteractionType.Like) post.stats.likes--;
        if (post.userInteraction === InteractionType.Dislike) post.stats.dislikes--;
        if (type === InteractionType.Like) post.stats.likes++;
        else post.stats.dislikes++;
      }
      post.userInteraction = type;
    }

    this.postsService.interact(post.id, type).subscribe({
      error: () => {
        post.userInteraction = oldInteraction;
        this.cdr.detectChanges();
      }
    });

    this.cdr.detectChanges();
  }

  toggleComments(post: any, event?: Event) {
    if (event) event.stopPropagation();
    post.showComments = !post.showComments;
    if (post.showComments && (!post.comments || post.comments.length === 0)) {
      this.loadCommentsForPost(post);
    }
  }

  loadCommentsForPost(post: any) {
    this.postsService.getPostById(post.id).subscribe((res: any) => {
      if (res.isSuccess && res.data) {
        const fullData = res.data.post || res.data;
        post.comments = fullData.comments || res.data.comments || [];
        this.cdr.detectChanges();
      }
    });
  }

  submitComment(post: any, event?: Event) {
    if (event) event.stopPropagation();
    if (!post.newCommentContent?.trim() || !this.currentUserId) return;

    this.postsService.addComment(post.id, post.newCommentContent).subscribe({
      next: (res: any) => {
        if (res.isSuccess) {
          if (!post.comments) post.comments = [];
          post.comments.unshift(res.data);
          if (post.stats) post.stats.comments++;
          post.newCommentContent = '';
          this.cdr.detectChanges();
        }
      }
    });
  }

  openReplyInput(commentId: number) {
    this.activeReplyId = this.activeReplyId === commentId ? null : commentId;
  }

  submitReply(post: any, parentComment: PostComment, content: string) {
    if (!content.trim() || !this.currentUserId) return;

    this.postsService.addComment(post.id, content, parentComment.id).subscribe({
      next: (res: any) => {
        if (res.isSuccess) {
          if (!parentComment.replies) parentComment.replies = [];
          parentComment.replies.push(res.data as any);
          if (post.stats) post.stats.comments++;
          this.replyInputs[parentComment.id] = '';
          this.activeReplyId = null;
          this.cdr.detectChanges();
        }
      }
    });
  }

  openShareModal(post: any, event?: Event) {
    if (event) event.stopPropagation();
    if (!this.currentUserId) {
      this.toastService.warning('Please login to share posts.');
      return;
    }
    this.sharingPostId = post.id;
    this.showShareModal = true;
    this.shareCommentary = '';
  }

  closeShareModal() {
    this.showShareModal = false;
    this.sharingPostId = null;
    this.shareCommentary = '';
    this.isSharing = false;
  }

  submitShare() {
    if (!this.sharingPostId) return;
    this.isSharing = true;

    this.postsService.sharePost(this.sharingPostId, this.shareCommentary).subscribe({
      next: (res: any) => {
        this.isSharing = false;
        if (res.isSuccess) {
          const post = this.user?.recentPosts?.find(p => p.id === this.sharingPostId)
            || this.savedPosts.find(p => p.id === this.sharingPostId);
          if (post && post.stats) post.stats.shares++;

          this.toastService.success('Post shared successfully!');
          this.closeShareModal();
        } else {
          this.toastService.error((res.error as any)?.message || 'Failed to share post.');
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSharing = false;
        this.toastService.error('Network error while sharing.');
        this.cdr.detectChanges();
      }
    });
  }

  viewPostDetails(postId: any, event?: Event) {
    if (event) event.stopPropagation();
    if (postId === 'create') {
      this.router.navigate(['/public/posts/create']);
      return;
    }
    this.router.navigate(['/public/posts/details', postId]);
  }

  // --- Manage Profile Actions ---

  triggerAvatarUpload() {
    document.getElementById('avatar-input')?.click();
  }

  triggerCoverUpload() {
    document.getElementById('cover-input')?.click();
  }

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.profileService.uploadAvatar(file).subscribe((res: any) => {
        if (res.isSuccess) {
          this.toastService.success('Avatar updated successfully!');
          this.loadProfile(this.currentUsername);
        } else {
          this.toastService.error('Failed to update avatar.');
        }
      });
    }
  }

  onCoverSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.profileService.uploadCover(file).subscribe((res: any) => {
        if (res.isSuccess) {
          this.toastService.success('Cover photo updated!');
          this.loadProfile(this.currentUsername);
        } else {
          this.toastService.error('Failed to update cover photo.');
        }
      });
    }
  }

  basicInfo: any = {};
  initBasicInfo() {
    if (this.user) {
      this.basicInfo = {
        FirstName: this.user.firstName,
        LastName: this.user.lastName,
        Headline: this.user.headline,
        Bio: this.user.bio,
        LocationId: this.user.locationId || 1
      };
    }
  }

  saveBasicInfo() {
    if (!this.basicInfo.FirstName || !this.basicInfo.LastName) {
      this.toastService.warning('Name is required.');
      return;
    }
    this.profileService.updateBasicInfo(this.basicInfo).subscribe((res: any) => {
      if (res.isSuccess) {
        this.toastService.success('Profile updated!');
        this.loadProfile(this.currentUsername);
      } else {
        this.toastService.error('Failed to update profile info.');
      }
    });
  }

  // Social Links
  newLink = { platform: 0, url: '' };
  isAddingLink = false;
  editingLink: any = null;

  addSocialLink() {
    if (!this.newLink.url) return;
    this.profileService.addSocialLink({
      Platform: Number(this.newLink.platform),
      Url: this.newLink.url
    }).subscribe((res: any) => {
      if (res.isSuccess) {
        this.toastService.success('Link added!');
        this.newLink = { platform: 0, url: '' };
        this.isAddingLink = false;
        this.loadProfile(this.currentUsername);
      }
    });
  }

  deleteLink(id: number) {
    if (!confirm('Are you sure you want to remove this link?')) return;
    this.profileService.deleteSocialLink(id).subscribe((res: any) => {
      if (res.isSuccess) {
        this.toastService.success('Link removed.');
        this.loadProfile(this.currentUsername);
      }
    });
  }

  // Experience
  newPosition = { Title: '', Company: '', StartDate: new Date().toISOString(), IsCurrent: true };
  isAddingPos = false;
  editingPos: any = null;

  addPosition() {
    if (!this.newPosition.Title || !this.newPosition.Company) return;
    this.profileService.addPosition(this.newPosition).subscribe((res: any) => {
      if (res.isSuccess) {
        this.toastService.success('Experience added!');
        this.isAddingPos = false;
        this.newPosition = { Title: '', Company: '', StartDate: new Date().toISOString(), IsCurrent: true };
        this.loadProfile(this.currentUsername);
      }
    });
  }

  deletePosition(id: number) {
    if (!confirm('Delete this experience?')) return;
    this.profileService.deletePosition(id).subscribe((res: any) => {
      if (res.isSuccess) {
        this.toastService.success('Experience removed.');
        this.loadProfile(this.currentUsername);
      }
    });
  }

  // Education
  newEdu = { School: '', Degree: '', FieldOfStudy: '', StartDate: new Date().toISOString() };
  isAddingEdu = false;
  editingEdu: any = null;

  addEducation() {
    if (!this.newEdu.School) return;
    this.profileService.addEducation(this.newEdu).subscribe((res: any) => {
      if (res.isSuccess) {
        this.toastService.success('Education added!');
        this.isAddingEdu = false;
        this.newEdu = { School: '', Degree: '', FieldOfStudy: '', StartDate: new Date().toISOString() };
        this.loadProfile(this.currentUsername);
      }
    });
  }

  deleteEducation(id: number) {
    if (!confirm('Delete this academic record?')) return;
    this.profileService.deleteEducation(id).subscribe((res: any) => {
      if (res.isSuccess) {
        this.toastService.success('Education removed.');
        this.loadProfile(this.currentUsername);
      }
    });
  }

  shareProfile() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => this.toastService.success('Profile link copied to clipboard!'));
  }

  // --- Helpers ---
  resolveImage(url: string | null | undefined): string {
    if (!url) return 'assets/images/default-avatar.png';
    if (url.includes('http') || url.startsWith('data:')) return url;
    return `${environment.apiBaseUrl2}/avatars/${url}`;
  }

  resolveCover(url: string | null | undefined): string {
    if (!url) return 'assets/images/default-cover.jpg';
    if (url.includes('http') || url.startsWith('data:')) return url;
    return `${environment.apiBaseUrl2}/covers/${url}`;
  }

  resolveAttachmentUrl(url: string | null | undefined): string {
    if (!url || url.trim() === '') return 'assets/images/default-post.jpg';
    let cleanUrl = url.replace('@local://', '');

    if (cleanUrl.startsWith('http') || cleanUrl.startsWith('https') || cleanUrl.startsWith('data:')) {
      return cleanUrl;
    }

    if (cleanUrl.startsWith('posts/')) {
      return `${environment.apiBaseUrl2}/${cleanUrl}`;
    }

    return `${environment.apiBaseUrl3}/${cleanUrl}`;
  }

  getAuthorImage(author: any): string {
    if (author && author.imageUrl) {
      if (author.imageUrl.includes('http')) return author.imageUrl;
      return `${environment.apiBaseUrl2}/avatars/${author.imageUrl}`;
    }
    return 'assets/images/default-avatar.png';
  }

  getAuthorName(author: any): string { return author?.name || author?.username || 'User'; }
  getPlatformName(id: number): string { return this.socialPlatforms.find(p => p.id === id)?.name || 'Link'; }
  getPlatformIcon(id: number): string { return this.socialPlatforms.find(p => p.id === id)?.icon || 'bi-link'; }
  getInitials(name: string): string { return name ? (name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()) : 'NYC'; }

  get displayName() {
    if (!this.user) return '';
    const first = this.user.firstName || '';
    const last = this.user.lastName || '';
    if (first.toLowerCase() === last.toLowerCase()) return first;
    return `${first} ${last}`.trim() || this.currentUsername;
  }

  getInterestName(id: number): string {
    return this.categories.find(c => c.id === id)?.name || 'Interest';
  }

  get isVerified(): boolean {
    if (!this.user || !this.user.stats) return false;
    return this.user.stats.isVerified === true;
  }
}
