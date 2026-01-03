// src/app/pages/Public/pages/posts/post-form/post-form.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { PostsService } from '../services/posts';
import { PostCategoryList } from '../models/posts';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './post-form.html',
  styleUrls: ['./post-form.scss']
})
export class PostFormComponent implements OnInit {
  
  private fb = inject(FormBuilder);
  private postsService = inject(PostsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: FormGroup;
  isEditMode = false;
  postId: number | null = null;
  isLoading = false;
  isSubmitting = false;
  categories = PostCategoryList;
  
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  existingImageUrl: string | null = null;

  constructor() {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      category: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.postId = +params['id'];
        this.loadPostData(this.postId);
      }
    });
  }

  loadPostData(id: number) {
    this.isLoading = true;
    this.postsService.getPostById(id).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.isSuccess) {
          const post = res.data;
          this.form.patchValue({
            title: post.title,
            content: post.content,
            category: post.category
          });
          this.existingImageUrl = post.imageUrl;
        }
      },
      error: () => this.isLoading = false
    });
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isSubmitting = true;
    const formData = this.form.value;

    // ✅ الحل: وضع الملف في مصفوفة لأن السيرفس يتوقع File[]
    const filesToSend = this.selectedFile ? [this.selectedFile] : undefined;

    let request$: Observable<any>;

    if (this.isEditMode && this.postId) {
      request$ = this.postsService.updatePost(this.postId, formData, filesToSend);
    } else {
      request$ = this.postsService.createPost(formData, filesToSend);
    }

    request$.subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res.isSuccess) {
          alert(this.isEditMode ? 'Post updated successfully' : 'Post created successfully');
          this.router.navigate(['/admin/posts']);
        } else {
          alert(res.error?.message || 'Operation failed');
        }
      },
      error: (err: any) => {
        this.isSubmitting = false;
        console.error(err);
        alert('Network error occurred');
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/posts']);
  }
}