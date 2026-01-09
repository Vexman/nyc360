import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../Authentication/Service/auth';
import { environment } from '../../../../../environments/environment';
import { PostsService } from '../services/posts';
import { Post, FeedData, InterestGroup, CommunitySuggestion, PostAuthor } from '../models/posts';
import { CATEGORY_LIST } from '../../../../../pages/models/category-list';
import { WeatherService } from '../services/weather';

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; }
interface Alert { type: 'yellow' | 'blue' | 'red'; title: string; desc: string; icon: string; }

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
  private weatherService = inject(WeatherService); // ✅ Inject
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

  // ✅ Real Weather Data
  weatherData: any = null;
  currentDate: Date = new Date();
  
  // ✅ Alerts Data (Dynamic)
  // تقدر تجيب الداتا دي من الـ API برضه لو عندك Endpoint، حالياً هي Array
  // لو الـ Array فاضية، القسم ده هيختفي تماماً
  alerts: Alert[] = [
    { type: 'yellow', title: 'Gridlock Alert', desc: 'Midtown traffic moving slow due to UN General Assembly', icon: 'bi-exclamation-triangle-fill' },
    { type: 'blue', title: 'Rain Expected', desc: 'Light showers starting around 4 PM', icon: 'bi-cloud-rain-fill' }
  ];

  isLoading = true;
  selectedCategoryId: number = -1; 
  categories = [{ id: -1, name: 'All', icon: 'bi-grid' }, ...CATEGORY_LIST];

  toasts: Toast[] = [];
  private toastCounter = 0;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const cat = params['category'];
      this.selectedCategoryId = cat !== undefined ? +cat : -1;
      this.loadFeed();
    });

    // ✅ Get Real Weather
    this.getRealWeather();
  }

  getRealWeather() {
    this.weatherService.getWeather().subscribe(data => {
      if (data) {
        this.weatherData = {
          temp: Math.round(data.main.temp), // Round to whole number
          desc: data.weather[0].description, // e.g., 'scattered clouds'
          icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
          humidity: data.main.humidity
        };
      }
      this.cdr.detectChanges();
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

  // ✅ Strict Image Filter Helper
  private hasValidImage(post: Post): boolean {
    // 1. Check if imageUrl exists and is not empty
    if (post.imageUrl && post.imageUrl.trim() !== '') return true;
    
    // 2. Check attachments if imageUrl is missing
    if (post.attachments && post.attachments.length > 0) {
        const url = post.attachments[0].url;
        if (url && url.trim() !== '') return true;
    }

    return false; // No image? Reject it.
  }

  processData(data: FeedData) {
    // ✅ 1. Filter ALL posts first (Global Filter)
    // أي بوست جاي من السيرفر ملوش صورة هيتشال من الحسبه قبل ما نوزعه
    const rawFeatured = data.featuredPosts || [];
    const validFeatured = rawFeatured.filter(p => this.hasValidImage(this.normalizePost(p)));
    
    this.featuredPosts = validFeatured.slice(0, 3);

    // Hero Banner Logic (Must have image)
    const rawDiscovery = data.discoveryPosts || [];
    const validDiscovery = rawDiscovery.filter(p => this.hasValidImage(this.normalizePost(p)));

    if (validDiscovery.length > 0) {
      this.heroBanner = validDiscovery[0];
    } else if (validFeatured.length > 3) {
      this.heroBanner = validFeatured[3];
    } else {
        this.heroBanner = null; // Hide hero if no valid image post found
    }

    // Interest Groups Logic
    this.interestGroups = (data.interestGroups || []).map(group => {
      // Filter posts inside each group
      const validGroupPosts = group.posts
        .map(p => this.normalizePost(p))
        .filter(p => this.hasValidImage(p)); // ⛔ Strict Filter
        
      return { ...group, posts: validGroupPosts };
    }).filter(g => g.posts.length > 0); // Remove empty groups

    // Highlights Logic
    this.highlightedPosts = [];
    this.interestGroups.forEach(group => {
      if (group.posts.length > 0) {
        // We already filtered images above, so this is safe
        this.highlightedPosts.push(group.posts[0]);
      }
    });

    this.trendingTags = data.trendingTags || [];
    this.suggestedCommunities = data.suggestedCommunities || [];
  }

  // ... (onSavePost, onJoinCommunity, showToast, removeToast ... same as before)
  onSavePost(post: Post, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (!this.authService.currentUser$.value) {
      this.showToast('Please login to save posts', 'info');
      return;
    }
    const originalState = post.isSaved;
    post.isSaved = !post.isSaved;
    this.postsService.savePost(post.id).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          const msg = post.isSaved ? 'Post saved successfully!' : 'Post unsaved';
          this.showToast(msg, 'success');
        } else {
          post.isSaved = originalState;
          this.showToast('Failed to save post', 'error');
        }
        this.cdr.detectChanges();
      },
      error: () => {
        post.isSaved = originalState;
        this.showToast('Error saving post', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  onJoinCommunity(comm: CommunitySuggestion) {
     if (!this.authService.currentUser$.value) { this.showToast('Login required', 'info'); return; }
     if (comm.isJoined || comm.isLoadingJoin) return;
     comm.isLoadingJoin = true;
     this.postsService.joinCommunity(comm.id).subscribe({
         next: (res) => {
             comm.isLoadingJoin = false;
             if(res.isSuccess) { comm.isJoined = true; this.showToast('Joined!', 'success'); }
             else this.showToast('Failed', 'error');
             this.cdr.detectChanges();
         },
         error: () => { comm.isLoadingJoin = false; this.cdr.detectChanges(); }
     })
  }
  
  private showToast(message: string, type: 'success'|'error'|'info') {
      const id = this.toastCounter++;
      this.toasts.push({id, message, type});
      setTimeout(() => this.removeToast(id), 3500);
  }
  removeToast(id: number) { this.toasts = this.toasts.filter(t => t.id !== id); this.cdr.detectChanges(); }

  // Helpers
  private normalizePost(post: any): Post {
    if (!post.stats) post.stats = { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0 };
    if (post.isSaved === undefined) post.isSaved = (post.isSavedByUser === true);
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
    // Note: The filter `hasValidImage` ensures we never reach here with an empty URL
    // But for safety, we keep logic
    if (url && url.includes('@local://')) return `${this.environment.apiBaseUrl3}/${url.replace('@local://', '')}`;
    return url && url.startsWith('http') ? url : `${this.environment.apiBaseUrl3}/${url}`;
  }
}