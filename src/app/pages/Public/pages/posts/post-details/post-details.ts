import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../Authentication/Service/auth';
// ✅ 1. Remove PostCategoryList from here
import { InteractionType, Post, PostAuthor, PostComment } from '../models/posts';
import { PostsService } from '../services/posts';
// ✅ 2. Import the shared CATEGORY_LIST
import { CATEGORY_LIST } from '../../../../../pages/models/category-list';

@Component({
  selector: 'app-post-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './post-details.html',
  styleUrls: ['./post-details.scss']
})
export class PostDetailsComponent implements OnInit {
  
  protected readonly environment = environment;
  protected readonly InteractionType = InteractionType;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postsService = inject(PostsService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  post: Post | null = null;
  isLoading = true;
  errorMessage = '';
  
  // ✅ 3. Use the shared list
  categories = CATEGORY_LIST;
  
  currentUserId: string | null = null;
  isAdmin = false;
  
  newCommentContent = '';
  replyInputs: { [key: number]: string } = {};
  activeReplyId: number | null = null;
  
  // Menu Control
  showMenu = false;

  // Report Modal Variables
  showReportModal = false;
  reportReason = '';

  // Sidebar Mock Data
  relatedPosts = [
    { title: 'New Express Bus Route Added', time: '28min', comments: 480, img: 'assets/images/bus.jpg' },
    { title: 'Subway Expansion Vote Results', time: '4h ago', comments: 2400, img: 'assets/images/train.jpg' },
    { title: 'City Bike Lanes Update', time: '1d ago', comments: 120, img: 'assets/images/bike.jpg' }
  ];

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.id) {
        this.currentUserId = user.id;
        this.isAdmin = Array.isArray(user.roles) ? user.roles.includes('Admin') : user.roles === 'Admin';
      }
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) this.loadPost(+id);
    });
  }

  loadPost(id: number) {
    this.isLoading = true;
    this.postsService.getPostById(id).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.isSuccess && res.data) {
          this.post = res.data;
          // Ensure stats object exists
          if (!this.post.stats) this.post.stats = { views: 0, likes: 0, dislikes: 0, comments: 0, shares: 0 };
          if (!this.post.comments) this.post.comments = [];
          if (this.post.currentUserInteraction !== undefined) {
             this.post.userInteraction = this.post.currentUserInteraction;
          }
        } else {
          this.errorMessage = res.error?.message || 'Post not found.';
        }
        this.cdr.detectChanges();
      },
      error: () => { 
        this.isLoading = false; 
        this.errorMessage = 'Network error.'; 
        this.cdr.detectChanges();
      }
    });
  }

  // --- Helpers ---
  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  openReportModal() {
    this.showMenu = false;
    this.showReportModal = true;
  }

  closeReportModal() {
    this.showReportModal = false;
    this.reportReason = '';
  }

  submitReport() {
    if (!this.reportReason.trim()) return;
    alert('Report submitted successfully!');
    this.closeReportModal();
  }

  getAuthorName(author: PostAuthor | string | undefined): string {
    if (!author) return 'NYC360 User';
    if (typeof author === 'string') return 'User';
    // Handle both new 'name' and old 'fullName/username' properties
    return author.name || author.fullName || author.username || 'User';
  }

  getAuthorAvatar(author: PostAuthor | string | undefined): string {
    if (typeof author === 'object' && author?.imageUrl) {
      return this.resolveImageUrl(author.imageUrl);
    }
    return 'assets/images/default-avatar.png';
  }

  resolveImageUrl(url: string | undefined | null): string {
    if (!url) return '';
    if (url.includes('@local://')) return `${this.environment.apiBaseUrl3}/${url.replace('@local://', '')}`;
    if (!url.startsWith('http') && !url.startsWith('data:')) return `${this.environment.apiBaseUrl}/${url}`;
    return url;
  }

  getCategoryName(id: number): string {
    // c is automatically typed correctly now because CATEGORY_LIST has a type
    return this.categories.find(c => c.id === id)?.name || 'News';
  }

  // --- Comments ---
  submitComment() {
    if (!this.newCommentContent.trim() || !this.post || !this.currentUserId) return;
    
    this.postsService.addComment(this.post.id, this.newCommentContent).subscribe({
      next: (res) => {
        if (res.isSuccess && this.post?.comments) {
          this.post.comments.unshift(res.data as any); 
          if(this.post.stats) this.post.stats.comments++;
          this.newCommentContent = '';
        }
      }
    });
  }

  openReplyInput(commentId: number) {
    this.activeReplyId = this.activeReplyId === commentId ? null : commentId;
  }

  submitReply(parentComment: PostComment, content: string) {
    if (!content || !content.trim() || !this.post || !this.currentUserId) return;

    this.postsService.addComment(this.post.id, content, parentComment.id).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          if (!parentComment.replies) parentComment.replies = [];
          parentComment.replies.push(res.data as any);
          if (this.post?.stats) this.post.stats.comments++;
          
          this.replyInputs[parentComment.id] = ''; 
          this.activeReplyId = null;
        }
      },
      error: () => alert('Failed to reply')
    });
  }

  // --- Interactions ---
  toggleInteraction(type: InteractionType) {
    if (!this.post || !this.currentUserId) return;
    const oldInteraction = this.post.userInteraction;
    
    if (this.post.userInteraction === type) {
      this.post.userInteraction = null;
      if (this.post.stats) type === InteractionType.Like ? this.post.stats.likes-- : this.post.stats.dislikes--;
    } else {
      if (this.post.stats) {
        if (this.post.userInteraction === InteractionType.Like) this.post.stats.likes--;
        if (this.post.userInteraction === InteractionType.Dislike) this.post.stats.dislikes--;
        type === InteractionType.Like ? this.post.stats.likes++ : this.post.stats.dislikes++;
      }
      this.post.userInteraction = type;
    }

    this.postsService.interact(this.post.id, type).subscribe({
      error: () => { if (this.post) this.post.userInteraction = oldInteraction; }
    });
  }

  get canEdit(): boolean {
    if (!this.post?.author || !this.currentUserId) return false;
    let authorId: any;
    if (typeof this.post.author === 'object') authorId = this.post.author.id;
    else authorId = this.post.author;
    return String(authorId) === String(this.currentUserId) || this.isAdmin;
  }

  onDelete() {
    if (this.post && confirm('Delete?')) {
      this.postsService.deletePost(this.post.id).subscribe({
        next: () => this.router.navigate(['/admin/posts'])
      });
    }
  }
}