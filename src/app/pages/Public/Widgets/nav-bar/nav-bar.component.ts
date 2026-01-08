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
  hasNotifications = true; 
  
  private userSub!: Subscription;

  // Categories with exact Bootstrap Icons matching your image
  categories = [
    { id: 'community', name: 'Community', icon: 'bi-people-fill', route: '/public/community' }, // Orange
    { id: 'culture', name: 'Culture', icon: 'bi-mask', route: '/culture' }, // Red
    { id: 'education', name: 'Education', icon: 'bi-journal-bookmark-fill', route: '/education' }, // Blue
    { id: 'events', name: 'Events', icon: 'bi-calendar-event-fill', route: '/events' }, // Purple
    { id: 'health', name: 'Health', icon: 'bi-heart-pulse-fill', route: '/health' }, // Light Blue
    { id: 'lifestyle', name: 'Lifestyle', icon: 'bi-person-arms-up', route: '/lifestyle' }, // Green
    { id: 'legal', name: 'Legal', icon: 'bi-bank2', route: '/legal' }, // Dark Navy
    { id: 'news', name: 'News', icon: 'bi-newspaper', route: '/news' }, // Grey
    { id: 'profession', name: 'Profession', icon: 'bi-briefcase-fill', route: '/profession' }, // Dk Green
    { id: 'social', name: 'Social', icon: 'bi-globe', route: '/social' }, // Teal
    { id: 'tour', name: 'Tour', icon: 'bi-map-fill', route: '/tour' }, // Yellow
    { id: 'tv', name: 'TV', icon: 'bi-tv-fill', route: '/tv' } // Dark Blue
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