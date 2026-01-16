import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../Service/auth';
import { trigger, style, animate, transition } from '@angular/animations';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './confirm-email.html',
  styleUrls: ['../login/login.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ConfirmEmailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  isLoading = true;
  isConfirmed = false;

  ngOnInit() {
    this.processConfirmation();
  }

  processConfirmation() {
    const email = this.route.snapshot.queryParamMap.get('email');
    let token = this.route.snapshot.queryParamMap.get('token');

    if (!email || !token) {
      this.toastService.error('Invalid link parameters.');
      this.isLoading = false;
      return;
    }

    token = token.replace(/ /g, '+');

    this.authService.confirmEmail({ email, token }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.isSuccess) {
          this.isConfirmed = true;
          this.toastService.success('Email confirmed successfully!');
          setTimeout(() => this.router.navigate(['/auth/login']), 3000);
        } else {
          this.toastService.error(res.error?.message || 'Verification failed.');
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Confirmation link expired or invalid.');
      }
    });
  }
}