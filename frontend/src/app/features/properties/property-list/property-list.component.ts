import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PropertyService, PropertyFilters } from '../../../core/services/property.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';
import { Property } from '../../../shared/models/models';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent, PropertyCardComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="page-header py-4">
      <div class="container">
        <h1 class="fw-bold mb-0">Find Your Stay</h1>
        <p class="text-muted">{{ total }} properties available across India</p>
      </div>
    </div>

    <section class="py-4">
      <div class="container">
        <div class="row g-4">
          <!-- Filters Sidebar -->
          <div class="col-lg-3">
            <div class="filter-sidebar p-4 rounded-3 shadow-sm bg-white">
              <h5 class="fw-bold mb-4"><i class="fas fa-sliders-h me-2 text-primary"></i>Filters</h5>

              <div class="mb-3">
                <label class="form-label fw-semibold">Search</label>
                <input type="text" class="form-control" placeholder="City, area, landmark..."
                  [(ngModel)]="filters.search" (keyup.enter)="applyFilters()">
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Property Type</label>
                <select class="form-select" [(ngModel)]="filters.property_type" (change)="applyFilters()">
                  <option value="">All Types</option>
                  <option value="pg">PG</option>
                  <option value="shared_room">Shared Room</option>
                  <option value="single_room">Single Room</option>
                  <option value="flat">Flat</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Min Rent (₹)</label>
                <input type="number" class="form-control" placeholder="0" [(ngModel)]="filters.min_rent">
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Max Rent (₹)</label>
                <input type="number" class="form-control" placeholder="100000" [(ngModel)]="filters.max_rent">
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Furnishing</label>
                <select class="form-select" [(ngModel)]="filters.furnishing" (change)="applyFilters()">
                  <option value="">Any</option>
                  <option value="furnished">Furnished</option>
                  <option value="semi-furnished">Semi-Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                </select>
              </div>

              <div class="mb-4">
                <label class="form-label fw-semibold">Min Bedrooms</label>
                <select class="form-select" [(ngModel)]="filters.bedrooms" (change)="applyFilters()">
                  <option [ngValue]="undefined">Any</option>
                  <option [ngValue]="1">1+</option>
                  <option [ngValue]="2">2+</option>
                  <option [ngValue]="3">3+</option>
                </select>
              </div>

              <button class="btn btn-primary w-100 mb-2" (click)="applyFilters()">
                <i class="fas fa-search me-2"></i>Apply Filters
              </button>
              <button class="btn btn-outline-secondary w-100" (click)="clearFilters()">Clear</button>
            </div>
          </div>

          <!-- Property Grid -->
          <div class="col-lg-9">
            @if (loading) {
              <div class="text-center py-5">
                <div class="spinner-border text-primary"></div>
                <p class="mt-3 text-muted">Loading properties...</p>
              </div>
            } @else if (properties.length > 0) {
              <div class="row g-4">
                @for (property of properties; track property.id) {
                  <div class="col-md-6 col-xl-4">
                    <app-property-card [property]="property"></app-property-card>
                  </div>
                }
              </div>

              <!-- Pagination -->
              @if (totalPages > 1) {
                <nav class="mt-5">
                  <ul class="pagination justify-content-center">
                    <li class="page-item" [class.disabled]="currentPage === 1">
                      <a class="page-link" (click)="goToPage(currentPage - 1)">‹</a>
                    </li>
                    @for (p of pages(); track p) {
                      <li class="page-item" [class.active]="p === currentPage">
                        <a class="page-link" (click)="goToPage(p)">{{ p }}</a>
                      </li>
                    }
                    <li class="page-item" [class.disabled]="currentPage === totalPages">
                      <a class="page-link" (click)="goToPage(currentPage + 1)">›</a>
                    </li>
                  </ul>
                </nav>
              }
            } @else {
              <div class="text-center py-5">
                <i class="fas fa-search fa-4x text-muted mb-4"></i>
                <h4>No properties found</h4>
                <p class="text-muted">Try adjusting or clearing your filters</p>
                <button class="btn btn-outline-primary mt-2" (click)="clearFilters()">Clear All Filters</button>
              </div>
            }
          </div>
        </div>
      </div>
    </section>

    <app-footer></app-footer>
  `,
  styles: [`
    .page-header { background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-bottom: 1px solid #dee2e6; }
    .filter-sidebar { position: sticky; top: 80px; }
    .page-link { cursor: pointer; }
  `],
})
export class PropertyListComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  properties: Property[] = [];
  loading = true;
  total = 0;
  currentPage = 1;
  totalPages = 1;
  readonly LIMIT = 12;

  filters: PropertyFilters = {};

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.filters = {
        city: params['city'],
        property_type: params['property_type'],
        search: params['search'],
        min_rent: params['min_rent'] ? Number(params['min_rent']) : undefined,
        max_rent: params['max_rent'] ? Number(params['max_rent']) : undefined,
      };
      this.currentPage = params['page'] ? Number(params['page']) : 1;
      this.loadProperties();
    });
  }

  loadProperties(): void {
    this.loading = true;
    this.propertyService.getProperties({ ...this.filters, page: this.currentPage, limit: this.LIMIT }).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.properties = res.data.properties;
          this.total = res.data.total;
          this.totalPages = Math.ceil(this.total / this.LIMIT);
        }
      },
      error: () => {},
      complete: () => { this.loading = false; },
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.updateQueryParams();
  }

  clearFilters(): void {
    this.filters = {};
    this.currentPage = 1;
    this.updateQueryParams();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateQueryParams();
    }
  }

  pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  private updateQueryParams(): void {
    const queryParams: Record<string, unknown> = { page: this.currentPage };
    for (const [k, v] of Object.entries(this.filters)) {
      if (v !== undefined && v !== '') queryParams[k] = v;
    }
    this.router.navigate([], { queryParams, replaceUrl: true });
  }
}
