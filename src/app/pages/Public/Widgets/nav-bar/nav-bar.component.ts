import { Component, OnInit, inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../Authentication/Service/auth';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit, OnDestroy {
  
  public authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  
  isMenuOpen = false;
  isLoggedIn = false;
  currentUsername: string | null = null;
  // يمكن إضافة منطق للإشعارات هنا
  hasNotifications = true; 
  
  private userSub!: Subscription;

  // 🔥 New Categories with Icons and Active Color Logic
  categories = [
    { id: 'all', name: 'All', icon: 'bi-grid-fill' },
    { id: 'community', name: 'Community', icon: 'bi-people-fill' },
    { id: 'culture', name: 'Culture', icon: 'bi-palette-fill' },
    { id: 'education', name: 'Education', icon: 'bi-mortarboard-fill' },
    { id: 'events', name: 'Events', icon: 'bi-calendar-event-fill' },
    { id: 'health', name: 'Health', icon: 'bi-heart-fill' },
    { id: 'legal', name: 'Legal', icon: 'bi-hammer' },
    { id: 'lifestyle', name: 'Lifestyle', icon: 'bi-person-arms-up' },
    { id: 'news', name: 'News', icon: 'bi-newspaper' },
    { id: 'profession', name: 'Profession', icon: 'bi-briefcase-fill' },
    { id: 'social', name: 'Social', icon: 'bi-globe' },
    { id: 'tour', name: 'Tour', icon: 'bi-airplane-fill' }
  ];

  ngOnInit() {
    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      if (user) {
        this.currentUsername = user.username || user.unique_name || user.email;
      } else {
        this.currentUsername = null;
      }
    });
  }

  toggleMenu() { 
    this.isMenuOpen = !this.isMenuOpen; 
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = this.isMenuOpen ? 'hidden' : 'auto';
    }
  }
  
  logout() {
    this.authService.logout();
    this.isMenuOpen = false;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'auto';
    }
  }

  ngOnDestroy() {
    if (this.userSub) this.userSub.unsubscribe();
  }
}