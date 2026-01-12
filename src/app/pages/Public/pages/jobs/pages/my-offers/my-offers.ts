import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MyOffersService } from '../../service/my-offers';
import { MyOffer } from '../../models/my-offers';

@Component({
  selector: 'app-my-offers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-offers.html',
  styleUrls: ['./my-offers.scss']
})
export class MyOffersComponent implements OnInit {
  private offersService = inject(MyOffersService);

  offers: MyOffer[] = [];
  isLoading = true;
  
  // Filters & Pagination
  currentFilter: 'all' | 'active' | 'closed' = 'all';
  pagination = { page: 1, pageSize: 20, totalPages: 1, totalCount: 0 };

  ngOnInit() {
    this.loadOffers();
  }

  loadOffers() {
    this.isLoading = true;
    
    // تحويل الفلتر الحالي لقيمة boolean أو undefined للسيرفس
    let isActiveParam: boolean | undefined = undefined;
    if (this.currentFilter === 'active') isActiveParam = true;
    if (this.currentFilter === 'closed') isActiveParam = false;

    this.offersService.getMyOffers(this.pagination.page, this.pagination.pageSize, isActiveParam).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.offers = res.data;
          this.pagination.totalPages = res.totalPages;
          this.pagination.totalCount = res.totalCount;
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  setFilter(filter: 'all' | 'active' | 'closed') {
    this.currentFilter = filter;
    this.pagination.page = 1; // الرجوع للصفحة الأولى عند تغيير الفلتر
    this.loadOffers();
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.pagination.totalPages) {
      this.pagination.page = newPage;
      this.loadOffers();
      window.scrollTo(0, 0);
    }
  }
}