import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../../../environments/environment';
import { AuthService } from '../../../../../Authentication/Service/auth';
import { CommunityRequestsComponent } from '../community-requests/community-requests';
import { CommunityProfileService } from '../../services/community-profile';
import { CommunityDetails, CommunityMember, Post } from '../../models/community-profile';

@Component({
  selector: 'app-community-profile',
  standalone: true,
  imports: [CommonModule, CommunityRequestsComponent],
  templateUrl: './community-profile.html',
  styleUrls: ['./community-profile.scss']
})
export class CommunityProfileComponent implements OnInit {
  
  private route = inject(ActivatedRoute);
  private profileService = inject(CommunityProfileService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  protected readonly environment = environment;

  // Data
  community: CommunityDetails | null = null;
  posts: Post[] = [];
  members: CommunityMember[] = [];
  ownerId: number = 0;
  
  // UI State
  activeTab: string = 'discussion';
  isLoading = false;
  isMembersLoading = false;
  isJoined = false;
  isOwner = false;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) this.loadData(slug);
    });
  }

  loadData(slug: string) {
    this.isLoading = true;
    this.profileService.getCommunityBySlug(slug).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.isSuccess && res.data) {
          this.community = res.data.community;
          this.ownerId = res.data.ownerId;
          this.checkOwnership(); 

          if (res.data.posts && Array.isArray(res.data.posts.data)) {
            this.posts = res.data.posts.data;
          } else {
            this.posts = [];
          }
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  checkOwnership() {
    const currentUser = this.authService.currentUser$.value;
    if (currentUser && this.ownerId) {
      this.isOwner = (currentUser.id === this.ownerId); 
    }
  }

  loadMembers() {
    if (!this.community) return;
    this.activeTab = 'members';
    this.isMembersLoading = true;
    this.profileService.getCommunityMembers(this.community.id).subscribe({
      next: (res) => {
        this.isMembersLoading = false;
        if (res.isSuccess && Array.isArray(res.data)) {
          this.members = res.data;
        }
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ New: Remove Member
  onRemoveMember(memberId: number) {
    if (!this.community || !confirm('Are you sure you want to remove this member?')) return;

    this.profileService.removeMember(this.community.id, memberId).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.members = this.members.filter(m => m.userId !== memberId);
          alert('Member removed successfully.');
        } else {
          alert('Failed to remove member.');
        }
      },
      error: () => alert('Network error.')
    });
  }

  // --- Image Helpers ---
  resolveCommunityImage(url?: string): string {
    if (!url) return 'assets/images/placeholder-cover.jpg';
    if (url.includes('http')) return url;
    return `${environment.apiBaseUrl2}/communities/${url}`;
  }

  resolvePostImage(url?: string): string {
    if (!url) return '';
    if (url.includes('http')) return url;
    return `${environment.apiBaseUrl2}/${url}`;
  }

  resolveUserAvatar(url?: string | null): string {
    if (!url) return 'assets/images/default-avatar.png'; // ✅ Fallback icon
    if (url.includes('http')) return url;
    return `${environment.apiBaseUrl2}/avatars/${url}`; 
  }

  getAuthorName(author: any): string {
    if (!author) return 'NYC360 Member';
    return typeof author === 'string' ? author : author.name;
  }
}