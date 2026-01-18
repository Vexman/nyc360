import { Injectable, signal } from '@angular/core';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string; // Custom title
    duration?: number;
    details?: string[]; // For validation errors list
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    toasts = signal<Toast[]>([]);

    show(
        message: string,
        type: 'success' | 'error' | 'info' | 'warning' = 'info',
        duration: number = 4000,
        title?: string,
        details?: string[]
    ) {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast: Toast = {
            id,
            message,
            type,
            duration,
            title,
            details
        };

        this.toasts.update(current => [...current, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, duration);
        }
    }

    success(message: string, title?: string) {
        this.show(message, 'success', 4000, title || 'نجح!');
    }

    error(message: string, title?: string, details?: string[]) {
        this.show(message, 'error', 6000, title || 'خطأ', details);
    }

    info(message: string, title?: string) {
        this.show(message, 'info', 4000, title || 'معلومة');
    }

    warning(message: string, title?: string) {
        this.show(message, 'warning', 5000, title || 'تنبيه');
    }

    // Helper for validation errors from backend
    validationError(errors: string[] | string, title?: string) {
        const errorList = Array.isArray(errors) ? errors : [errors];
        this.show(
            'الرجاء تصحيح الأخطاء التالية:',
            'error',
            8000,
            title || 'خطأ في البيانات',
            errorList
        );
    }

    // Helper for network errors
    networkError() {
        this.show(
            'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.',
            'error',
            6000,
            'خطأ في الاتصال'
        );
    }

    // Helper for permission errors
    permissionError(action?: string) {
        const message = action
            ? `ليس لديك صلاحية لـ ${action}`
            : 'ليس لديك الصلاحيات الكافية لهذا الإجراء';
        this.show(message, 'warning', 5000, 'تنبيه صلاحيات');
    }

    remove(id: string) {
        this.toasts.update(current => current.filter(t => t.id !== id));
    }
}
