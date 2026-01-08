import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../Authentication/Service/auth';
import { environment } from '../../../../../environments/environment';
import { PostsService } from '../services/posts';
import { Post, FeedData, InterestGroup, CommunitySuggestion, PostAuthor } from '../models/posts';
import { CATEGORY_LIST } from '../../../../../pages/models/category-list';

// Interface for Custom Toasts
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class Home implements OnInit {
  
  protected readonly environment = environment;
  private postsService = inject(PostsService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  // Data
  featuredPosts: Post[] = [];      
  heroBanner: Post | null = null;  
  interestGroups: InterestGroup[] = []; 
  trendingTags: string[] = [];
  suggestedCommunities: CommunitySuggestion[] = [];
  highlightedPosts: Post[] = [];

  isLoading = true;
  selectedCategoryId: number = -1; 
  categories = [{ id: -1, name: 'All', icon: 'bi-grid' }, ...CATEGORY_LIST];

  // Toast System Data
  toasts: Toast[] = [];
  private toastCounter = 0;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const cat = params['category'];
      this.selectedCategoryId = cat !== undefined ? +cat : -1;
      this.loadFeed();
    });
  }

  loadFeed() {
    this.isLoading = true;
    this.postsService.getPostsFeed().subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.processData(res.data);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Failed to load feed', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  processData(data: FeedData) {
    const allFeatured = (data.featuredPosts || []).map(p => this.normalizePost(p));
    this.featuredPosts = allFeatured.slice(0, 3);

    if (data.discoveryPosts && data.discoveryPosts.length > 0) {
      this.heroBanner = this.normalizePost(data.discoveryPosts[0]);
    } else if (allFeatured.length > 3) {
      this.heroBanner = allFeatured[3];
    }

    this.interestGroups = (data.interestGroups || []).map(group => ({
      ...group,
      posts: group.posts.map(p => this.normalizePost(p))
    }));

    this.highlightedPosts = [];
    this.interestGroups.forEach(group => {
      if (group.posts.length > 0) {
        this.highlightedPosts.push(group.posts[0]);
      }
    });

    this.trendingTags = data.trendingTags || [];
    this.suggestedCommunities = data.suggestedCommunities || [];
  }

  onJoinCommunity(comm: CommunitySuggestion) {
    if (!this.authService.currentUser$.value) {
      this.showToast('Please login to join communities', 'info');
      return;
    }

    if (comm.isJoined || comm.isLoadingJoin) return;

    comm.isLoadingJoin = true;

    this.postsService.joinCommunity(comm.id).subscribe({
      next: (res) => {
        comm.isLoadingJoin = false;
        if (res.isSuccess) {
          comm.isJoined = true;
          if (comm.memberCount !== undefined) comm.memberCount++;
          this.showToast(`Successfully joined ${comm.name}!`, 'success');
        } else {
          this.showToast(res.error?.message || 'Failed to join', 'error');
        }
        this.cdr.detectChanges();
      },
      error: () => {
        comm.isLoadingJoin = false;
        this.showToast('An error occurred while joining.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // --- Professional Toast System ---
  private showToast(message: string, type: 'success' | 'error' | 'info') {
    const id = this.toastCounter++;
    const toast: Toast = { id, message, type };
    this.toasts.push(toast);
    
    // Auto remove after 3.5 seconds
    setTimeout(() => {
      this.removeToast(id);
    }, 3500);
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.cdr.detectChanges();
  }

  // --- Helpers ---
  private normalizePost(post: Post): Post {
    if (!post.stats) post.stats = { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0 };
    return post;
  }

  getAuthorName(author: PostAuthor | string | undefined | null): string {
    if (!author) return 'NYC360';
    if (typeof author === 'string') return author;
    return author.name || author.username || 'NYC360';
  }

  getAuthorImage(author: PostAuthor | string | undefined | null): string {
    if (typeof author === 'object' && author?.imageUrl) {
        if (author.imageUrl.includes('http')) return author.imageUrl;
        return `${this.environment.apiBaseUrl3}/${author.imageUrl}`;
    }
    return 'assets/images/default-avatar.png';
  }

  getCategoryName(id: number): string {
    const cat = this.categories.find(c => c.id === id);
    return cat ? cat.name : 'General';
  }

  resolvePostImage(post: Post): string {
    const attachment = post.attachments?.[0];
    const url = attachment?.url || post.imageUrl;
    
    if (!url) return 'assets/images/default-placeholder.jpg';
    if (url.includes('@local://')) return `${this.environment.apiBaseUrl3}/${url.replace('@local://', '')}`;
    return url.startsWith('http') ? url : `${this.environment.apiBaseUrl3}/${url}`;
  }
}