import { Injectable, signal } from '@angular/core';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    duration?: number;
    details?: string[];
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
        this.show(message, 'success', 4000, title || 'Success!');
    }

    error(message: string, title?: string, details?: string[]) {
        this.show(message, 'error', 6000, title || 'Error', details);
    }

    info(message: string, title?: string) {
        this.show(message, 'info', 4000, title || 'Info');
    }

    warning(message: string, title?: string) {
        this.show(message, 'warning', 5000, title || 'Warning');
    }

    // Helper for validation errors from backend
    validationError(errors: string[] | string, title?: string) {
        const errorList = Array.isArray(errors) ? errors : [errors];
        this.show(
            'Please correct the following errors:',
            'error',
            8000,
            title || 'Validation Error',
            errorList
        );
    }

    // Helper for network errors
    networkError() {
        this.show(
            'Unable to connect to the server. Please check your internet connection and try again.',
            'error',
            6000,
            'Connection Error'
        );
    }

    // Helper for permission errors
    permissionError(action?: string) {
        const message = action
            ? `You don't have permission to ${action.toLowerCase()}`
            : 'You don\'t have sufficient permissions for this action';
        this.show(message, 'warning', 5000, 'Permission Denied');
    }

    remove(id: string) {
        this.toasts.update(current => current.filter(t => t.id !== id));
    }
}
