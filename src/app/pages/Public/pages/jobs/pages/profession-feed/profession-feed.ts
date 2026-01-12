import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProfessionFeedData, FeedArticle } from '../../models/profession-feed';
import { ProfessionFeedService } from '../../service/profession-feed';
import { environment } from '../../../../../../environments/environment';
import { ArticleHeroComponent } from '../../../../Widgets/article-hero.component/article-hero.component';
import { ArticleGridCardComponent } from '../../../../Widgets/article-grid-card.component/article-grid-card.component';

@Component({
  selector: 'app-profession-feed',
  standalone: true,
  imports: [CommonModule, RouterLink, ArticleHeroComponent, ArticleGridCardComponent],
  templateUrl: './profession-feed.html',
  styleUrls: ['./profession-feed.scss']
})
export class ProfessionFeedComponent implements OnInit {
  private feedService = inject(ProfessionFeedService);
  private cdr = inject(ChangeDetectorRef);
  
  feedData: ProfessionFeedData | null = null;
  isLoading = true;

  ngOnInit() {
    this.loadFeed();
  }

  loadFeed() {
    this.isLoading = true;
    this.feedService.getFeed().subscribe({
      next: (res) => {
        if (res.isSuccess) {
          // ✅ هنا بنستخدم الداتا اللي جاية من الرسبونص بتاعك مباشرة
          this.feedData = res.data;
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

  // دالة لجلب الصورة بناءً على مسار الـ attachments في الرسبونص بتاعك
  getArticleImage(article: FeedArticle): string {
    const url = article.attachments?.[0]?.url;
    if (!url) return 'assets/images/placeholder.jpg';
    if (url.startsWith('http')) return url;
    // السيرفر بتاعك بيبعت @local:// بنشيلها ونحط الـ Base URL
    return `${environment.apiBaseUrl3}/${url.replace('@local://', '')}`;
  }
}