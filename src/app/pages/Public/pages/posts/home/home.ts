import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../Authentication/Service/auth';
import { environment } from '../../../../../environments/environment';
import { PostsService } from '../services/posts';
import { InteractionType, Post, PostAuthor } from '../models/posts';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit {
  
  protected readonly environment = environment;
  protected readonly InteractionType = InteractionType;

  private postsService = inject(PostsService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  currentUser: any = null;
  currentUserId: string | null = null;
  posts: Post[] = [];
  isLoading = true;
  selectedCategoryId: number | null = null;

  // Categories List (Ordered)
  categories = [
    { id: null, name: 'All', icon: 'bi-grid-fill' },
    { id: 1, name: 'Art', icon: 'bi-palette' },
    { id: 2, name: 'Community', icon: 'bi-people-fill' },
    { id: 3, name: 'Culture', icon: 'bi-bank' },
    { id: 4, name: 'Education', icon: 'bi-mortarboard' },
    { id: 5, name: 'Events', icon: 'bi-calendar-event' },
    { id: 6, name: 'Lifestyle', icon: 'bi-cup-hot' },
    { id: 7, name: 'Media', icon: 'bi-collection-play' },
    { id: 8, name: 'News', icon: 'bi-newspaper' },
    { id: 9, name: 'Recruitment', icon: 'bi-briefcase' },
    { id: 10, name: 'Social', icon: 'bi-chat-heart' },
    { id: 11, name: 'Tourism', icon: 'bi-airplane' },
    { id: 12, name: 'TV', icon: 'bi-tv' }
  ];

  trendingTags = ['NYC_Events', 'ManhattanArt', 'SubwayUpdates', 'TechSummit'];
  communities = [
    { name: 'NYC Tech United', members: '12k', acronym: 'NT' },
    { name: 'Brooklyn Artists', members: '8.5k', acronym: 'BA' }
  ];

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.currentUserId = user?.id;
    });

    this.route.queryParams.subscribe(params => {
      const catId = params['category'];
      this.selectedCategoryId = catId ? Number(catId) : null;
      this.loadPosts();
    });
  }

  loadPosts() {
    this.isLoading = true;
    this.postsService.getAllPosts(this.selectedCategoryId || undefined).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.isSuccess && Array.isArray(res.data)) {
          // Normalize Data
          this.posts = res.data.map(p => {
            if (!p.stats) p.stats = { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0 };
            // Sync names
            if (p.currentUserInteraction !== undefined) p.userInteraction = p.currentUserInteraction;
            return p;
          });
        } else {
          this.posts = [];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.posts = [];
        this.cdr.detectChanges();
      }
    });
  }

  filterByCategory(id: number | null) {
    this.selectedCategoryId = id;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: id }
    });
  }

  // --- Helpers ---
  resolvePostImage(url: string | undefined): string | null {
    if (!url) return null;
    if (url.includes('@local://')) return `${this.environment.apiBaseUrl3}/${url.replace('@local://', '')}`;
    if (!url.startsWith('http') && !url.startsWith('data:')) return `${this.environment.apiBaseUrl3}/${url}`;
    return url;
  }

  getAuthorName(author: PostAuthor | string | undefined): string {
    if (!author) return 'NYC360 User';
    if (typeof author === 'string') return 'NYC360 User';
    return author.fullName || author.username || 'NYC360 User';
  }

  getAuthorAvatar(author: PostAuthor | string | undefined): string {
    if (typeof author === 'object' && author?.imageUrl) {
      return this.resolvePostImage(author.imageUrl) || 'assets/images/default-avatar.png';
    }
    return 'assets/images/default-avatar.png';
  }

  toggleLike(post: Post) {
    if (!this.currentUserId) { 
      alert('Please login to interact');
      return; 
    }
    
    const oldInteraction = post.userInteraction;
    const isLiked = post.userInteraction === InteractionType.Like;
    
    // Optimistic Update
    if (isLiked) {
      post.userInteraction = null;
      post.currentUserInteraction = null;
      if(post.stats) post.stats.likes--;
    } else {
      if (post.userInteraction === InteractionType.Dislike && post.stats) post.stats.dislikes--;
      post.userInteraction = InteractionType.Like;
      post.currentUserInteraction = InteractionType.Like;
      if(post.stats) post.stats.likes++;
    }

    this.postsService.interact(post.id, InteractionType.Like).subscribe({
      error: () => {
        // Revert
        post.userInteraction = oldInteraction;
        post.currentUserInteraction = oldInteraction;
        if (post.stats) isLiked ? post.stats.likes++ : post.stats.likes--;
      }
    });
  }
}