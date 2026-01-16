import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, style, animate, transition } from '@angular/animations';
import { AuthService } from '../../Service/auth';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
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
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  isLoading = false;

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.warning('Please enter a valid email.');
      return;
    }

    this.isLoading = true;

    this.authService.forgotPassword({ email: this.form.value.email }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.isSuccess) {
          this.toastService.success('Reset link sent to your inbox.');
          this.form.reset();
        } else {
          this.toastService.error(res.error?.message || 'Action failed.');
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Network error.');
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}