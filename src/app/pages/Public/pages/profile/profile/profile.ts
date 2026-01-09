import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { ProfileService } from '../service/profile';
import { AuthService } from '../../../../Authentication/Service/auth';
import { 
  UserProfileData, UpdateBasicProfileDto, AddEducationDto, UpdateEducationDto,
  AddPositionDto, UpdatePositionDto, Education, Position, SocialPlatform, SocialLinkDto 
} from '../models/profile';
import { Post } from '../../posts/models/posts';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule ,RouterLink],
  providers: [DatePipe],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit {
  
  protected readonly environment = environment;
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private datePipe = inject(DatePipe);

  // --- State ---
  user: UserProfileData | null = null;
  savedPosts: Post[] = []; 
  
  // Track current profile username for reloading
  currentUsername: string = '';

  isLoading = true;
  isSavedLoading = false; 
  isOwner = false;
  activeTab = 'posts'; 
  isSaving = false;
  
  // --- Forms ---
  basicForm!: FormGroup;
  eduForm!: FormGroup;
  posForm!: FormGroup;
  socialForm!: FormGroup;

  // --- Modals Control ---
  modalState = {
    basic: false,
    education: false,
    position: false,
    social: false
  };
  
  // Edit Mode Trackers
  isEditMode = false;
  selectedItemId: number | null = null;

  // Enums for UI
  socialPlatforms = [
    { id: SocialPlatform.Facebook, name: 'Facebook' },
    { id: SocialPlatform.Twitter, name: 'Twitter' },
    { id: SocialPlatform.LinkedIn, name: 'LinkedIn' },
    { id: SocialPlatform.Github, name: 'Github' },
    { id: SocialPlatform.Website, name: 'Website' },
    { id: SocialPlatform.Other, name: 'Other' }
  ];

  ngOnInit() {
    this.initForms();
    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      this.resolveIdentityAndLoad(username);
    });
  }

  // --- Initialization ---
  initForms() {
    // Basic Info Form with Validation
    this.basicForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      headline: ['', [Validators.required, Validators.maxLength(100)]],
      bio: ['', [Validators.maxLength(500)]],
      locationId: [0] 
    });

    // Education Form
    this.eduForm = this.fb.group({
      school: ['', Validators.required],
      degree: ['', Validators.required],
      fieldOfStudy: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['']
    });

    // Position Form
    this.posForm = this.fb.group({
      title: ['', Validators.required],
      company: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      isCurrent: [false]
    });

    // Social Link Form
    this.socialForm = this.fb.group({
      platform: [SocialPlatform.Website, Validators.required],
      url: ['', [Validators.required, Validators.pattern('https?://.+')]]
    });
  }

  resolveIdentityAndLoad(routeUsername: string | null) {
    const currentUser = this.authService.currentUser$.value;
    let targetUsername = routeUsername;

    if (!targetUsername) {
      targetUsername = currentUser?.username || '';
      this.isOwner = true; 
    } else {
      this.isOwner = (currentUser?.username?.toLowerCase() === targetUsername.toLowerCase());
    }

    // ✅ FIX: Ensure targetUsername is a string (handle null)
    this.currentUsername = targetUsername || '';

    if (targetUsername) this.loadProfile(targetUsername);
    else this.isLoading = false;
  }

  loadProfile(username: string) {
    this.isLoading = true;
    this.profileService.getProfile(username).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.isSuccess && res.data) {
          this.user = res.data;
        }
        this.cdr.detectChanges();
      },
      error: () => this.isLoading = false
    });
  }

  // Switch Tab Logic
  switchTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'saved' && this.isOwner) {
      this.loadSavedPosts();
    }
  }

  // Load Saved Posts API
  loadSavedPosts() {
    this.isSavedLoading = true;
    this.profileService.getSavedPosts().subscribe({
      next: (res) => {
        this.isSavedLoading = false;
        if (res.isSuccess) {
          this.savedPosts = res.data || [];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSavedLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- Share Feature ---
  shareProfile() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Profile link copied to clipboard!');
    });
  }

  // --- BASIC INFO Operations ---
  openBasicModal() {
    if (!this.user) return;
    this.basicForm.patchValue({
      firstName: this.user.profile.firstName,
      lastName: this.user.profile.lastName,
      headline: this.user.profile.headline,
      bio: this.user.profile.bio,
      locationId: this.user.profile.locationId || 1 
    });
    this.modalState.basic = true;
  }

  saveBasicInfo() {
    if (this.basicForm.invalid) {
      this.basicForm.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    
    const dto: UpdateBasicProfileDto = {
      FirstName: this.basicForm.value.firstName,
      LastName: this.basicForm.value.lastName,
      Headline: this.basicForm.value.headline,
      Bio: this.basicForm.value.bio,
      LocationId: Number(this.basicForm.value.locationId)
    };

    this.profileService.updateBasicInfo(dto).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.isSuccess) {
          this.modalState.basic = false;
          this.reload(); 
        }
      },
      error: () => this.isSaving = false
    });
  }

  // --- EDUCATION Operations ---
  openAddEdu() {
    this.isEditMode = false;
    this.eduForm.reset();
    this.modalState.education = true;
  }

  openEditEdu(edu: Education) {
    this.isEditMode = true;
    this.selectedItemId = edu.id;
    this.eduForm.patchValue({
      school: edu.school,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      startDate: this.formatDateForInput(edu.startDate),
      endDate: this.formatDateForInput(edu.endDate)
    });
    this.modalState.education = true;
  }

  saveEdu() {
    if (this.eduForm.invalid) { this.eduForm.markAllAsTouched(); return; }
    this.isSaving = true;
    const val = this.eduForm.value;
    
    if (this.isEditMode && this.selectedItemId) {
      const dto: UpdateEducationDto = {
        EducationId: this.selectedItemId,
        School: val.school, Degree: val.degree, FieldOfStudy: val.fieldOfStudy,
        StartDate: new Date(val.startDate).toISOString(),
        EndDate: val.endDate ? new Date(val.endDate).toISOString() : undefined
      };
      this.profileService.updateEducation(dto).subscribe(res => this.handleResponse(res, 'education'));
    } else {
      const dto: AddEducationDto = {
        School: val.school, Degree: val.degree, FieldOfStudy: val.fieldOfStudy,
        StartDate: new Date(val.startDate).toISOString(),
        EndDate: val.endDate ? new Date(val.endDate).toISOString() : undefined
      };
      this.profileService.addEducation(dto).subscribe(res => this.handleResponse(res, 'education'));
    }
  }

  deleteEdu(id: number) {
    if(confirm('Are you sure you want to delete this education?')) {
      this.profileService.deleteEducation(id).subscribe(() => this.reload());
    }
  }

  // --- POSITION Operations ---
  openAddPos() {
    this.isEditMode = false;
    this.posForm.reset({ isCurrent: false });
    this.modalState.position = true;
  }

  openEditPos(pos: Position) {
    this.isEditMode = true;
    this.selectedItemId = pos.id;
    this.posForm.patchValue({
      title: pos.title,
      company: pos.company,
      startDate: this.formatDateForInput(pos.startDate),
      endDate: this.formatDateForInput(pos.endDate),
      isCurrent: pos.isCurrent
    });
    this.modalState.position = true;
  }

  savePos() {
    if (this.posForm.invalid) { this.posForm.markAllAsTouched(); return; }
    this.isSaving = true;
    const val = this.posForm.value;

    if (this.isEditMode && this.selectedItemId) {
      const dto: UpdatePositionDto = {
        PositionId: this.selectedItemId, Title: val.title, Company: val.company,
        StartDate: new Date(val.startDate).toISOString(),
        EndDate: val.endDate ? new Date(val.endDate).toISOString() : undefined,
        IsCurrent: val.isCurrent
      };
      this.profileService.updatePosition(dto).subscribe(res => this.handleResponse(res, 'position'));
    } else {
      const dto: AddPositionDto = {
        Title: val.title, Company: val.company,
        StartDate: new Date(val.startDate).toISOString(),
        EndDate: val.endDate ? new Date(val.endDate).toISOString() : undefined,
        IsCurrent: val.isCurrent
      };
      this.profileService.addPosition(dto).subscribe(res => this.handleResponse(res, 'position'));
    }
  }

  deletePos(id: number) {
    if(confirm('Delete this position?')) {
      this.profileService.deletePosition(id).subscribe(() => this.reload());
    }
  }

  // --- SOCIAL LINKS Operations ---
  openAddSocial() {
    this.isEditMode = false;
    this.socialForm.reset({ platform: 0 });
    this.modalState.social = true;
  }
  
  openEditSocial(link: any) {
    this.isEditMode = true;
    this.selectedItemId = link.id || link.linkId; 
    this.socialForm.patchValue({
      platform: link.platform,
      url: link.url
    });
    this.modalState.social = true;
  }

  saveSocial() {
    if(this.socialForm.invalid) { this.socialForm.markAllAsTouched(); return; }
    this.isSaving = true;
    const val = this.socialForm.value;

    const dto: SocialLinkDto = {
      LinkId: this.isEditMode ? this.selectedItemId! : 0,
      Platform: Number(val.platform),
      Url: val.url
    };

    if(this.isEditMode) {
      this.profileService.updateSocialLink(dto).subscribe(res => this.handleResponse(res, 'social'));
    } else {
      this.profileService.addSocialLink(dto).subscribe(res => this.handleResponse(res, 'social'));
    }
  }

  // --- Image Uploads ---
  onAvatarSelected(event: any) {
    if (!this.isOwner) return;
    const file = event.target.files[0];
    if (file) {
      this.profileService.uploadAvatar(file).subscribe({
        next: (res) => {
          if(res.isSuccess) this.reload();
        },
        error: (err) => console.error('Avatar upload failed', err)
      });
    }
  }

  onCoverSelected(event: any) {
    if (!this.isOwner) return;
    const file = event.target.files[0];
    if (file) {
      this.profileService.uploadCover(file).subscribe({
        next: (res) => {
          if(res.isSuccess) this.reload();
        },
        error: (err) => console.error('Cover upload failed', err)
      });
    }
  }

  // --- Helpers ---
  reload() {
    // Reload using currentUsername
    if(this.currentUsername) this.loadProfile(this.currentUsername);
  }

  handleResponse(res: any, modalKey: keyof typeof this.modalState) {
    this.isSaving = false;
    if (res.isSuccess) {
      this.modalState[modalKey] = false;
      this.reload();
    }
  }

  closeModals() {
    Object.keys(this.modalState).forEach(key => this.modalState[key as keyof typeof this.modalState] = false);
  }

  formatDateForInput(dateStr?: string): string {
    if (!dateStr) return '';
    return this.datePipe.transform(dateStr, 'yyyy-MM-dd') || '';
  }

  getPlatformName(id: number): string {
    return this.socialPlatforms.find(p => p.id === id)?.name || 'Link';
  }

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

  // Helper for Post Images in Feed/Saved
  resolvePostImage(post: Post): string {
    if (post.attachments && post.attachments.length > 0) {
      const url = post.attachments[0].url;
      if (url.includes('http')) return url;
      return `${environment.apiBaseUrl3}/${url}`;
    }
    return 'assets/images/default-post.jpg'; 
  }

  // Helper for Author Image
  getAuthorImage(author: any): string {
    if (author && typeof author === 'object' && author.imageUrl) {
        if (author.imageUrl.includes('http')) return author.imageUrl;
        return `${environment.apiBaseUrl2}/avatars/${author.imageUrl}`;
    }
    return 'assets/images/default-avatar.png';
  }

  // Helper for Author Name
  getAuthorName(author: any): string {
    if (!author) return 'Unknown';
    if (typeof author === 'string') return author;
    return author.name || author.username || 'NYC360 User';
  }

  get displayName() { return this.user ? `${this.user.profile.firstName} ${this.user.profile.lastName}` : ''; }
}