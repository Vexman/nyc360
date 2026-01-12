import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MyApplicationsService } from '../../service/my-applications';
import { MyApplication } from '../../models/my-applications';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-applications.component.html',
  styleUrls: ['./my-applications.component.scss']
})
export class MyApplicationsComponent implements OnInit {
  private appsService = inject(MyApplicationsService);
  private cdr = inject(ChangeDetectorRef);

  applications: MyApplication[] = [];
  isLoading = true;
  isWithdrawing: number | null = null;

  ngOnInit() {
    this.loadApps();
  }

  loadApps() {
    this.isLoading = true;
    this.appsService.getMyApplications().subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.applications = res.data;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => (this.isLoading = false)
    });
  }

  onWithdraw(appId: number) {
    if (!confirm('Are you sure you want to withdraw this application?')) return;

    this.isWithdrawing = appId;
    this.appsService.withdrawApplication(appId).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          alert('Application withdrawn successfully.');
          this.loadApps(); // إعادة تحميل القائمة
        }
        this.isWithdrawing = null;
      },
      error: () => {
        alert('Failed to withdraw application.');
        this.isWithdrawing = null;
      }
    });
  }

  // Helpers for UI
  getStatusLabel(status: number): string {
    return ['Pending', 'Accepted', 'Rejected', 'Withdrawn'][status] || 'Unknown';
  }

  getStatusClass(status: number): string {
    return ['status-pending', 'status-accepted', 'status-rejected', 'status-withdrawn'][status] || '';
  }
}