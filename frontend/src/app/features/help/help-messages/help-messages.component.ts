import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HelpService, HelpArticle } from '../../../core/services/help.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';

@Component({
  selector: 'app-help-messages',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="help-hero py-5 text-white">
      <div class="container py-4">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li class="breadcrumb-item"><a routerLink="/help" class="text-white opacity-75">Help Center</a></li>
            <li class="breadcrumb-item active text-white" aria-current="page">{{ categoryName() }}</li>
          </ol>
        </nav>
        <h1 class="display-5 fw-bold">{{ categoryName() }}</h1>
        <p class="lead opacity-75">Find all articles and help related to {{ categoryName() }}</p>
      </div>
    </div>

    <section class="py-5">
      <div class="container">
        <div class="row g-5">
          <div class="col-lg-8">
            @if (loading()) {
              <div class="text-center py-5">
                <div class="spinner-border text-danger" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
            } @else {
              @if (selectedArticle()) {
                <div class="article-detail fade-in">
                  <button (click)="selectedArticle.set(null)" class="btn btn-outline-secondary btn-sm mb-4">
                    <i class="fas fa-arrow-left me-2"></i>Back to {{ categoryName() }}
                  </button>
                  <h1 class="fw-bold mb-3">{{ selectedArticle()?.title }}</h1>
                  <div class="d-flex align-items-center gap-3 text-muted small mb-4 pb-4 border-bottom">
                    <span><i class="far fa-clock me-1"></i> {{ selectedArticle()?.read_time }} min read</span>
                    <span><i class="far fa-calendar-alt me-1"></i> Updated {{ selectedArticle()?.updated_at | date }}</span>
                  </div>
                  <div class="article-content" style="font-size: 1.1rem; line-height: 1.8; color: #444;">
                    {{ selectedArticle()?.content }}
                  </div>
                </div>
              } @else {
                <h2 class="fw-bold mb-4">{{ categoryName() }} Articles</h2>
                @if (articles().length === 0) {
                  <p class="text-muted">No articles found in this category.</p>
                }
                @for (article of articles(); track article.id) {
                  <div class="article-item p-3 border-bottom cursor-pointer" (click)="selectedArticle.set(article)">
                    <div class="d-flex align-items-start gap-3">
                      <i class="fas fa-file-alt text-danger mt-1"></i>
                      <div>
                        <h5 class="fw-bold mb-1">{{ article.title }}</h5>
                        @if (article.is_popular) {
                          <span class="badge bg-danger-subtle text-danger rounded-pill mb-2">Popular</span>
                        }
                        <p class="text-muted small mb-0">Updated {{ article.updated_at | date }} · {{ article.read_time }} min read</p>
                      </div>
                    </div>
                  </div>
                }
              }
            }
          </div>
          <div class="col-lg-4">
            <div class="p-4 bg-light rounded-4 sticky-top" style="top: 100px;">
              <h4 class="fw-bold mb-3">Support</h4>
              <p class="text-muted">Can't find what you're looking for?</p>
              <a routerLink="/contact" class="btn btn-danger w-100 mb-3">Email Us</a>
              <a href="tel:+916294347052" class="btn btn-outline-danger w-100">Call Support</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <app-footer></app-footer>
  `,
  styles: `
    .help-hero { background: linear-gradient(135deg, #EE2E24, #d42a20); }
    .article-item { transition: all 0.2s; cursor: pointer; border-radius: 8px; }
    .article-item:hover { background: #fff3f2; transform: translateX(5px); }
    .cursor-pointer { cursor: pointer; }
    .fade-in { animation: fadeIn 0.3s ease-in; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `
})
export class HelpMessagesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private helpService = inject(HelpService);

  categoryName = signal('');
  articles = signal<HelpArticle[]>([]);
  selectedArticle = signal<HelpArticle | null>(null);
  loading = signal(false);

  ngOnInit() {
    this.route.params.subscribe(params => {
      const cat = params['category'];
      if (cat) {
        this.categoryName.set(cat);
        this.loadArticles(cat);
      }
    });
  }

  loadArticles(category: string) {
    this.loading.set(true);
    this.helpService.getArticlesByCategory(category).subscribe({
      next: (res) => {
        this.articles.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
