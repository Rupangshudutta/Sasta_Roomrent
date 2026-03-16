import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PropertyService, PropertyFilters } from '../../../core/services/property.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';
import { SkeletonListComponent } from '../../../shared/components/skeleton/skeleton.components';
import { Property } from '../../../shared/models/models';

@Component({
  selector: 'app-property-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterLink,
    NavbarComponent, FooterComponent,
    PropertyCardComponent, SkeletonListComponent,
  ],
  templateUrl: './property-list.component.html',
  styles: [`
    .page-header { background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-bottom: 1px solid #dee2e6; }
    .filter-sidebar { position: sticky; top: 20px; }
    .page-link { cursor: pointer; }
    .filter-panel {
      transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
      overflow: hidden;
      opacity: 1;
    }
    .filter-panel.closed {
      width: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      opacity: 0;
      border: none;
    }
    .transition-all {
      transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    .drawer-toggle-btn {
      position: absolute;
      left: -16px;
      top: 20px;
      z-index: 100;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      transition: transform 0.3s ease, background 0.3s;
    }
    .drawer-toggle-btn:hover {
      background: #d42a20;
      transform: scale(1.1);
    }
    .grid-wrapper {
      position: relative;
    }
  `],
})
export class PropertyListComponent implements OnInit, OnDestroy {
  private propertyService = inject(PropertyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Use signals for all reactive state
  properties = signal<Property[]>([]);
  loading = signal(true);
  error = signal('');
  total = signal(0);
  currentPage = signal(1);
  totalPages = signal(1);
  isFilterOpen = signal(true);
  readonly LIMIT = 12;

  filters: PropertyFilters = {};

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.filters = {
          city: params['city'],
          property_type: params['property_type'],
          search: params['search'],
          min_rent: params['min_rent'] ? Number(params['min_rent']) : undefined,
          max_rent: params['max_rent'] ? Number(params['max_rent']) : undefined,
        };
        this.currentPage.set(params['page'] ? Number(params['page']) : 1);
        this.loadProperties();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProperties(): void {
    this.loading.set(true);
    this.error.set('');
    this.propertyService
      .getProperties({ ...this.filters, page: this.currentPage(), limit: this.LIMIT })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res.success && res.data) {
            this.properties.set(res.data.properties);
            this.total.set(res.data.total);
            this.totalPages.set(Math.ceil(res.data.total / this.LIMIT));
          }
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.error.set('Failed to load properties. Please try again.');
          this.loading.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.updateQueryParams();
  }

  clearFilters(): void {
    this.filters = {};
    this.currentPage.set(1);
    this.updateQueryParams();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.updateQueryParams();
    }
  }

  pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  /** trackBy for property list — prevents unnecessary DOM re-creation */
  trackByPropertyId(_: number, p: Property): number {
    return p.id;
  }

  private updateQueryParams(): void {
    const queryParams: Record<string, unknown> = { page: this.currentPage() };
    for (const [k, v] of Object.entries(this.filters)) {
      if (v !== undefined && v !== '') queryParams[k] = v;
    }
    this.router.navigate([], { queryParams, replaceUrl: true });
  }
}
