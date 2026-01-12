import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Services
import { JobProfileService } from '../../service/job-profile';

// Models & Env
import { JobProfile, RelatedJob, Applicant } from '../../models/job-profile';
import { environment } from '../../../../../../environments/environment';
import { AuthService } from '../../../../../Authentication/Service/auth';

@Component({
  selector: 'app-job-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './job-profile.html',
  styleUrls: ['./job-profile.scss']
})
export class JobProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private jobService = inject(JobProfileService);
  private authService = inject(AuthService); // ✅ حقن خدمة المصادقة
  private cdr = inject(ChangeDetectorRef);
  
  // Data
  job: JobProfile | null = null;
  relatedJobs: RelatedJob[] = [];
  applicants: Applicant[] = [];
  
  // UI States
  activeTab: string = 'overview';
  isLoading: boolean = true;
  isLoadingApplicants: boolean = false;
  imgBase = environment.apiBaseUrl2;

  // Author Logic
  currentUserId: number | null = null; 
  isAuthor: boolean = false;

  // Apply Modal State
  showApplyModal: boolean = false;
  coverLetterText: string = '';
  isSubmittingApply: boolean = false;

  ngOnInit(): void {
    // 1. جلب الـ ID من السرفيس الموحد بدلاً من فك التشفير يدوياً
    this.currentUserId = this.authService.getUserId();
    console.log('Current User ID:', this.currentUserId);

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) { this.loadJobData(id); }
    });
  }

  loadJobData(id: string): void {
    this.isLoading = true;
    this.jobService.getJobProfile(id).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.job = res.data.offer;
          this.relatedJobs = res.data.relatedJobs || [];
          
          // ✅ المقارنة الصحيحة باستخدام المتغيرات الموجودة
          if (this.currentUserId && this.job.author.id === this.currentUserId) {
            this.isAuthor = true;
            console.log('User IS the author. Enabling owner features.');
          } else {
            this.isAuthor = false;
          }
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

  onTabChange(tab: string): void {
    this.activeTab = tab;
    // لو صاحب الوظيفة داس على تاب المتقدمين، حمل البيانات
    if (tab === 'applicants' && this.isAuthor && this.job) {
      this.loadApplicants();
    }
  }

  loadApplicants(): void {
    if (!this.job) return;
    this.isLoadingApplicants = true;
    this.jobService.getJobApplicants(this.job.id).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.applicants = res.data || [];
        }
        this.isLoadingApplicants = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingApplicants = false;
        this.cdr.detectChanges();
      }
    });
  }

  getAvatarUrl(imageName: string | undefined): string {
    if (!imageName) return 'assets/images/default-avatar.png';
    if (imageName.startsWith('http')) return imageName;
    return `${this.imgBase}/avatars/${imageName}`;
  }

  onConfirmApply(): void {
    if (!this.job || !this.coverLetterText.trim()) return;
    this.isSubmittingApply = true;
    this.jobService.applyToOffer(this.job.id, this.coverLetterText).subscribe({
      next: (res) => {
        this.isSubmittingApply = false;
        if (res.isSuccess) {
          alert('Application sent successfully!');
          this.showApplyModal = false;
          this.coverLetterText = '';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSubmittingApply = false;
        alert('Failed to send application.');
        this.cdr.detectChanges();
      }
    });
  }

  // Translators
  getArrangement(v: number) { return ['On-Site', 'Remote', 'Hybrid'][v] || 'On-Site'; }
  getType(v: number) { return ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'][v] || 'Full-time'; }
  getLevel(v: number) { return ['Entry', 'Junior', 'Mid-Level', 'Senior-Mid', 'Senior'][v] || 'N/A'; }
  
  getApplicantStatus(s: number) {
    const statuses = ['Pending', 'Reviewed', 'Shortlisted', 'Rejected', 'Hired', 'New'];
    return statuses[s] || 'Pending';
  }
}