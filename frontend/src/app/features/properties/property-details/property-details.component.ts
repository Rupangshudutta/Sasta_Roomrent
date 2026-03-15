import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { PropertyService } from '../../../core/services/property.service';
import { Property } from '../../../shared/models/models';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './property-details.component.html',
  styles: [`
    .gallery-img { height: 400px; object-fit: cover; border-radius: 12px; width: 100%; }
    .sticky-card { position: sticky; top: 100px; }
  `]
})
export class PropertyDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private propertyService = inject(PropertyService);

  property = signal<Property | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProperty(Number(id));
    } else {
      this.error.set('Invalid property ID');
      this.loading.set(false);
    }
  }

  private loadProperty(id: number): void {
    this.loading.set(true);
    this.propertyService.getPropertyById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.property.set(res.data.property);
        } else {
          this.error.set(res.message || 'Failed to load property');
        }
      },
      error: (err) => {
        console.error('Error fetching property Details:', err);
        this.error.set('Failed to connect to the server');
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }
}
