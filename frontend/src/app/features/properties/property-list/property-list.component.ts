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
  templateUrl: './property-list.component.html',
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
  error = '';

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
    console.log('[Property List] 🔄 Loading properties with filters:', { ...this.filters, page: this.currentPage, limit: this.LIMIT });
    this.loading = true;
    this.propertyService.getProperties({ ...this.filters, page: this.currentPage, limit: this.LIMIT }).subscribe({
      next: (res: any) => {
        console.log('[Property List] ✅ Backend response received:', res);
        if (res.success && res.data) {
          this.properties = res.data.properties;
          this.total = res.data.total;
          this.totalPages = Math.ceil(this.total / this.LIMIT);
          console.log(`[Property List] 📊 Loaded ${this.properties.length} properties out of ${this.total} total.`);
        }
      },
      error: (err) => { 
        console.error('[Property List] ❌ ERROR loading properties:', err);
        this.loading = false; 
      },
      complete: () => { 
        console.log('[Property List] ✨ Loading complete');
        this.loading = false; 
      },
    });
  }

  applyFilters(): void {
    console.log('[Property List] 🔍 Apply Filters clicked. Current filters:', this.filters);
    this.currentPage = 1;
    this.updateQueryParams();
  }

  clearFilters(): void {
    console.log('[Property List] 🧹 Clear Filters clicked.');
    this.filters = {};
    this.currentPage = 1;
    this.updateQueryParams();
  }

  goToPage(page: number): void {
    console.log(`[Property List] 📄 Page change requested to page ${page}`);
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
