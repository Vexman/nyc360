import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toastService.toasts()" 
           class="toast-item" 
           [ngClass]="toast.type"
           @toastAnimation>
        <div class="icon-wrapper">
          <i class="bi" [ngClass]="{
            'bi-check-circle-fill': toast.type === 'success',
            'bi-x-circle-fill': toast.type === 'error',
            'bi-info-circle-fill': toast.type === 'info',
            'bi-exclamation-triangle-fill': toast.type === 'warning'
          }"></i>
        </div>
        <div class="content">
          <span class="title">{{ toast.title || toast.type }}</span>
          <span class="message">{{ toast.message }}</span>
          
          <!-- Validation errors list -->
          <ul class="error-list" *ngIf="toast.details && toast.details.length > 0">
            <li *ngFor="let detail of toast.details">{{ detail }}</li>
          </ul>
        </div>
        <button class="close-btn" (click)="toastService.remove(toast.id)">
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
      max-width: 450px;
    }

    .toast-item {
      pointer-events: auto;
      min-width: 320px;
      max-width: 450px;
      background: white;
      border: 1px solid #e2e8f0;
      border-left: 5px solid;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, currentColor, transparent);
        opacity: 0.3;
      }

      &.success { 
        border-left-color: #10b981; 
        color: #065f46;
        &::before { color: #10b981; }
        .icon-wrapper { 
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          color: #059669; 
        }
      }
      
      &.error { 
        border-left-color: #ef4444; 
        color: #991b1b;
        &::before { color: #ef4444; }
        .icon-wrapper { 
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #dc2626; 
        }
      }
      
      &.info { 
        border-left-color: #3b82f6; 
        color: #1e40af;
        &::before { color: #3b82f6; }
        .icon-wrapper { 
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #2563eb; 
        }
      }
      
      &.warning { 
        border-left-color: #f59e0b; 
        color: #92400e;
        &::before { color: #f59e0b; }
        .icon-wrapper { 
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #d97706; 
        }
      }

      .icon-wrapper {
        width: 38px;
        height: 38px;
        min-width: 38px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.3rem;
        margin-top: 2px;
      }

      .content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        
        .title { 
          font-weight: 700; 
          font-size: 0.95rem; 
          letter-spacing: 0.3px;
          margin-bottom: 2px;
          display: block;
        }
        
        .message { 
          font-size: 0.9rem; 
          line-height: 1.5;
          opacity: 0.9;
          display: block;
        }

        .error-list {
          margin: 8px 0 0 0;
          padding: 12px 16px;
          background: rgba(0,0,0,0.03);
          border-radius: 8px;
          list-style: none;

          li {
            position: relative;
            padding-left: 20px;
            font-size: 0.85rem;
            line-height: 1.6;
            margin-bottom: 6px;
            color: inherit;
            opacity: 0.95;

            &:last-child {
              margin-bottom: 0;
            }

            &::before {
              content: '•';
              position: absolute;
              left: 6px;
              font-weight: 700;
              font-size: 1.1rem;
            }
          }
        }
      }

      .close-btn {
        background: none;
        border: none;
        color: currentColor;
        opacity: 0.4;
        cursor: pointer;
        font-size: 1.3rem;
        padding: 4px;
        transition: all 0.2s;
        margin-top: 2px;
        min-width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        
        &:hover { 
          opacity: 1;
          background: rgba(0,0,0,0.05);
        }
      }
    }

    // Mobile responsive
    @media (max-width: 480px) {
      .toast-container {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
      }

      .toast-item {
        min-width: auto;
        max-width: none;
        padding: 14px 16px;
        
        .icon-wrapper {
          width: 32px;
          height: 32px;
          min-width: 32px;
          font-size: 1.1rem;
        }

        .content {
          .title {
            font-size: 0.9rem;
          }

          .message {
            font-size: 0.85rem;
          }

          .error-list li {
            font-size: 0.8rem;
          }
        }
      }
    }
  `],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(120%)', opacity: 0 }),
        animate('350ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('250ms cubic-bezier(0.4, 0.0, 1, 1)', style({ transform: 'translateX(120%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
