import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../Authentication/Service/auth';
import { environment } from '../../../../../environments/environment';
import { PostsService } from '../services/posts';
import { Post, FeedData, InterestGroup, CommunitySuggestion, InteractionType, PostAuthor } from '../models/posts';
import { CATEGORY_LIST } from '../../../../../pages/models/category-list';

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
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Data
  featuredPosts: Post[] = [];      // الكروت الثلاثة العلوية
  heroBanner: Post | null = null;  // الكارت العريض (العجلة)
  interestGroups: InterestGroup[] = []; // الأقسام السفلية (Lifestyle, Events)
  trendingTags: string[] = [];
  suggestedCommunities: CommunitySuggestion[] = [];
  
  isLoading = true;
  selectedCategoryId: number = -1; 
  categories = [{ id: -1, name: 'All', icon: 'bi-grid' }, ...CATEGORY_LIST];

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
        this.cdr.detectChanges();
      }
    });
  }

  processData(data: FeedData) {
    // 1. Featured Posts: نأخذ أول 3 عناصر للكروت العلوية
    const allFeatured = (data.featuredPosts || []).map(p => this.normalizePost(p));
    this.featuredPosts = allFeatured.slice(0, 3);

    // 2. Banner: نأخذ أول عنصر من discoveryPosts ليكون البانر العريض
    // أو يمكن أخذ العنصر الرابع من الـ Featured إذا لم يوجد discovery
    if (data.discoveryPosts && data.discoveryPosts.length > 0) {
      this.heroBanner = this.normalizePost(data.discoveryPosts[0]);
    } else if (allFeatured.length > 3) {
      this.heroBanner = allFeatured[3];
    }

    // 3. باقي الأقسام
    this.interestGroups = (data.interestGroups || []).map(group => ({
      ...group,
      posts: group.posts.map(p => this.normalizePost(p))
    }));

    this.trendingTags = data.trendingTags || [];
    this.suggestedCommunities = data.suggestedCommunities || [];
  }

  private normalizePost(post: Post): Post {
    if (!post.stats) post.stats = { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0 };
    return post;
  }

  // --- Helpers ---

  // حل مشكلة الخطأ 2339 و 2532
  getAuthorName(author: PostAuthor | string | undefined | null): string {
    if (!author) return 'NYC360';
    if (typeof author === 'string') return author;
    return author.name || author.username || 'NYC360';
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