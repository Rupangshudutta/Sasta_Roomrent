import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../core/services/property.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { PropertyCardComponent } from '../../shared/components/property-card/property-card.component';
import { SkeletonListComponent } from '../../shared/components/skeleton/skeleton.components';
import { Property } from '../../shared/models/models';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterLink,
    NavbarComponent, FooterComponent,
    PropertyCardComponent, SkeletonListComponent
  ],
  templateUrl: './home.component.html',
  styles: [`
    /* Relying on global styles.scss */
  `],
})
export class HomeComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private router = inject(Router);

  properties = signal<Property[]>([]);
  loading = signal<boolean>(true);
  activeFilter = signal<string>('');
  searchCity = signal<string>('');
  searchType = signal<string>('');

  howItWorks = [
    { icon: 'fa-search', title: 'Search', desc: 'Find your preferred location and accommodation type', color: '#EE2E24' },
    { icon: 'fa-eye', title: 'View', desc: 'Browse detailed property information and photos', color: '#1A73E8' },
    { icon: 'fa-handshake', title: 'Connect', desc: 'Contact property owners directly', color: '#34A853' },
    { icon: 'fa-home', title: 'Move In', desc: 'Settle into your perfect long-term stay', color: '#F59E0B' },
  ];

  ngOnInit(): void { this.loadProperties(); }

  loadProperties(filters = {}): void {
    this.loading.set(true);
    this.propertyService.getProperties({ limit: 6, ...filters }).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.properties.set(res.data.properties);
        }
      },
      error: () => {
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  search(): void {
    const city = this.searchCity();
    const type = this.searchType();
    this.router.navigate(['/properties'], {
      queryParams: { city: city || undefined, property_type: type || undefined },
    });
  }

  filterByType(type: string): void {
    this.activeFilter.set(type);
    this.loadProperties(type ? { property_type: type } : {});
  }

  filterByBudget(filter: string): void {
    this.activeFilter.set(filter);
    this.loadProperties({ max_rent: 10000 });
  }
}

