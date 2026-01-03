import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { Post, PostCategoryList, PostAuthor } from '../models/posts';
import { PostsService } from '../services/posts';
import { AuthService } from '../../../../Authentication/Service/auth';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './post-list.html',
  styleUrls: ['./post-list.scss']
})
export class PostListComponent implements OnInit {
  
  protected readonly environment = environment;
  private postsService = inject(PostsService);
  private authService = inject(AuthService); 
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  posts: Post[] = [];
  categories = PostCategoryList;
  isLoading = true;
  errorMessage = '';
  selectedCategoryId: number | null = null;
  currentUserId: string | null = null;
  isAdmin = false;

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserId = user.id || user.userId;
        this.isAdmin = Array.isArray(user.roles) ? user.roles.includes('Admin') : user.roles === 'Admin';
      }
    });

    this.route.queryParams.subscribe(params => {
      const catId = params['category'];
      this.selectedCategoryId = catId ? Number(catId) : null;
      this.loadPosts();
    });
  }

  loadPosts() {
    this.isLoading = true;
    const categoryParam = this.selectedCategoryId !== null ? this.selectedCategoryId : undefined;

    this.postsService.getAllPosts(categoryParam).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.isSuccess) {
          this.posts = Array.isArray(res.data) ? res.data : [];
          this.cdr.detectChanges();
        }
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  filterByCategory(id: number | null) {
    this.selectedCategoryId = id;
    this.router.navigate([], { relativeTo: this.route, queryParams: { category: id } });
  }

  // ✅ Helper Template Methods
  getAuthorName(author: PostAuthor | string | undefined): string {
    if (!author) return 'User';
    if (typeof author === 'string') return 'User';
    return author.fullName || 'User';
  }

  // ✅ إصلاح مشكلة الـ Type Checking هنا
  canEditPost(post: Post): boolean {
    if (!this.currentUserId || !post.author) return false;
    
    let authorId: any;
    if (typeof post.author === 'object') {
      authorId = post.author.id;
    } else {
      authorId = post.author;
    }
    
    return String(authorId) === String(this.currentUserId) || this.isAdmin;
  }

  getCategoryName(id: number): string {
    return this.categories.find(c => c.id === id)?.name || 'General';
  }

  onDelete(id: number) {
    if (confirm('Delete post?')) {
      this.postsService.deletePost(id).subscribe({
        next: () => this.loadPosts()
      });
    }
  }
}