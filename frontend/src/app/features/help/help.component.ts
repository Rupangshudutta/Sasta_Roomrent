import { Component, inject, signal, effect, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { HelpService, HelpArticle, HelpCategory } from '../../core/services/help.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './help.component.html',
  styles: [`
    .help-hero { background: linear-gradient(135deg, #EE2E24, #d42a20); color: white; padding: 80px 0; }
    .search-hero-input { border-radius: 50px; padding: 18px 30px; font-size: 1.1rem; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.2); width: 100%; max-width: 600px; }
    .category-card { background: white; border-radius: 16px; padding: 30px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.07); transition: all 0.3s; cursor: pointer; border: 2px solid transparent; }
    .category-card:hover { border-color: #EE2E24; transform: translateY(-4px); box-shadow: 0 8px 30px rgba(238,46,36,0.15); }
    .category-card i { font-size: 2.5rem; color: #EE2E24; margin-bottom: 15px; display: block; }
    .category-card h5 { font-weight: 700; }
    .article-item { padding: 20px 0; border-bottom: 1px solid #f0f0f0; display: flex; align-items: start; gap: 15px; }
    .article-item:last-child { border-bottom: none; }
    .article-item i { color: #EE2E24; font-size: 1.2rem; flex-shrink: 0; margin-top: 2px; }
    .article-title { font-weight: 600; text-decoration: none; color: #1a1a1a; }
    .article-title:hover { color: #EE2E24; }
    .popular-tag { background: #fff3f2; color: #EE2E24; font-size: 0.75rem; font-weight: 700; padding: 2px 10px; border-radius: 20px; margin-left: 8px; }
  `],
})
export class HelpComponent {
  private helpService = inject(HelpService);

  searchQuery = '';
  //categories: any[] = [];
  categories = [
    { icon: 'fas fa-search', title: 'Finding a Room', count: 12 },
    { icon: 'fas fa-rupee-sign', title: 'Payments & Pricing', count: 8 },
    { icon: 'fas fa-home', title: 'Listing a Property', count: 10 },
    { icon: 'fas fa-shield-alt', title: 'Safety & Trust', count: 6 },
    { icon: 'fas fa-calendar-check', title: 'Bookings', count: 9 },
    { icon: 'fas fa-user-cog', title: 'Account & Profile', count: 7 },
  ];
  //articles: Map<string, string[]> = new Map();
  articles = [
    { title: 'How to search for rooms in a specific city', popular: true, href: '#' },
    { title: 'Understanding the booking process', popular: true, href: '#' },
    { title: 'How to verify a property before booking', popular: false, href: '#' },
    { title: 'Cancellation and refund policy explained', popular: true, href: '#' },
    { title: 'How to report a fraudulent listing', popular: false, href: '#' },
    { title: 'Setting up payment methods securely', popular: false, href: '#' },
    { title: 'How to upload photos for your listing', popular: false, href: '#' },
    { title: 'What documents are required for listing?', popular: true, href: '#' },
  ];
  loading = false;

  categoryIcons: Record<string, string> = {
    'Finding a Room': 'fas fa-search',
    'Payments & Pricing': 'fas fa-rupee-sign',
    'Listing a Property': 'fas fa-home',
    'Safety & Trust': 'fas fa-shield-alt',
    'Bookings': 'fas fa-calendar-check',
    'Account & Profile': 'fas fa-user-cog',
  };

  constructor() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.loading = true;
    this.helpService.getCategories().subscribe({
      next: (res) => {
        this.categories = res.data.map(c => ({
          title: c.category,
          count: c.count,
          icon: this.categoryIcons[c.category] || 'fas fa-file-alt'
        }));
      }
    });

    this.helpService.getPopularArticles().subscribe({
      next: (res) => {
        this.articles = res.data.map(a => ({
          ...a,
          href: `/help/messages/${encodeURIComponent(a.category)}`, // Correct navigation
          popular: a.is_popular
        }));
        this.loading = false;
      }
    });
  }

  onSearch() {
    if (this.searchQuery.length < 2) {
      this.loadInitialData();
      return;
    }
    this.loading = true;
    this.helpService.searchArticles(this.searchQuery).subscribe({
      next: (res) => {
        this.articles = res.data.map(a => ({
          ...a,
          href: `/help/messages/${encodeURIComponent(a.category)}`,
          popular: a.is_popular
        }));
        this.loading = false;
      }
    });
  }
}
