import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertyService } from '../../core/services/property.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { PropertyCardComponent } from '../../shared/components/property-card/property-card.component';
import { Property } from '../../shared/models/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent, PropertyCardComponent],
  templateUrl: './home.component.html',
  styles: [`
    /* We intentionally leave this mostly blank because all original styles are in styles.scss now */
  `],
})
export class HomeComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private router = inject(Router);

  properties: Property[] = [];
  loading = true;
  activeFilter = '';
  searchCity = '';
  searchType = '';

  howItWorks = [
    { icon: 'fa-search', title: 'Search', desc: 'Find your preferred location and accommodation type', color: '#EE2E24' },
    { icon: 'fa-eye', title: 'View', desc: 'Browse detailed property information and photos', color: '#1A73E8' },
    { icon: 'fa-handshake', title: 'Connect', desc: 'Contact property owners directly', color: '#34A853' },
    { icon: 'fa-home', title: 'Move In', desc: 'Settle into your perfect long-term stay', color: '#F59E0B' },
  ];

  ngOnInit(): void { this.loadProperties(); }

  loadProperties(filters = {}): void {
    this.loading = true;
    this.propertyService.getProperties({ limit: 6, ...filters }).subscribe({
      next: (res: any) => { if (res.success && res.data) this.properties = res.data.properties; },
      error: () => {},
      complete: () => { this.loading = false; },
    });
  }

  search(): void {
    this.router.navigate(['/properties'], {
      queryParams: { city: this.searchCity || undefined, property_type: this.searchType || undefined },
    });
  }

  filterByType(type: string): void {
    this.activeFilter = type;
    this.loadProperties(type ? { property_type: type } : {});
  }

  filterByBudget(filter: string): void {
    this.activeFilter = filter;
    this.loadProperties({ max_rent: 10000 });
  }
}
