import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Property } from '../../models/models';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="property-card card position-relative h-100">
      <img
        [src]="property.primary_image || property.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'"
        class="card-img-top"
        [alt]="property.title"
        loading="lazy"
      >
      <span class="property-type-badge">{{ property.property_type | titlecase }}</span>
      @if (property.is_featured) {
        <span class="featured-badge" style="position: absolute; top: 12px; right: 12px; background: #f59e0b; color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;"><i class="fas fa-star me-1"></i>Featured</span>
      }

      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h5 class="card-title mb-0 text-truncate" style="max-width:70%">{{ property.title }}</h5>
          @if (property.rating_count > 0) {
            <span class="rating">{{ property.rating_avg | number:'1.1-1' }} <i class="fas fa-star"></i></span>
          }
        </div>
        <p class="text-muted mb-2"><i class="fas fa-map-marker-alt me-1"></i> {{ property.city }}, {{ property.state }}</p>
        <div class="amenities mb-3">
          <small class="d-block"><i class="fas fa-bed"></i> {{ property.bedrooms }} Bed</small>
          <small class="d-block"><i class="fas fa-bath"></i> {{ property.bathrooms }} Bath</small>
          <small class="d-block"><i class="fas fa-couch"></i> {{ property.furnishing }}</small>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <span class="price">₹{{ property.rent_amount | number }}<small>/month</small></span>
          <a [routerLink]="['/properties', property.id]" class="btn btn-sm btn-outline-primary">
            View Details
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Relying on global styles.scss for .property-card, .price, .rating, etc. */
  `],
})
export class PropertyCardComponent {
  @Input({ required: true }) property!: Property;
}
