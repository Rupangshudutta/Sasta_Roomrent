import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { PropertyService } from '../../../core/services/property.service';
import { BookingService } from '../../../core/services/booking.service';
import { Property } from '../../../shared/models/models';

@Component({
  selector: 'app-booking-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './booking-checkout.component.html',
  styles: [`
    .summary-card { position: sticky; top: 100px; }
  `]
})
export class BookingCheckoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public location = inject(Location);
  private propertyService = inject(PropertyService);
  private bookingService = inject(BookingService);

  // Property data
  property = signal<Property | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Form State using Signals
  checkInDate = signal<string>('');
  leaseMonths = signal<number>(1);
  notes = signal<string>('');
  
  isSubmitting = signal(false);

  // Computed totals
  totalRent = computed(() => {
    const p = this.property();
    return p ? p.rent_amount * this.leaseMonths() : 0;
  });

  totalAmount = computed(() => {
    const p = this.property();
    return p ? this.totalRent() + p.security_deposit : 0;
  });

  ngOnInit(): void {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Default to tomorrow
    this.checkInDate.set(today.toISOString().split('T')[0]);

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProperty(Number(id));
    } else {
      this.error.set('Invalid property ID');
      this.loading.set(false);
    }
  }

  private loadProperty(id: number): void {
    this.propertyService.getPropertyById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const prop = res.data.property;
          this.property.set(prop);
          this.leaseMonths.set(prop.min_lease_months || 1);
        } else {
          this.error.set(res.message || 'Failed to load property details');
        }
      },
      error: (err) => {
        console.error('Error fetching property:', err);
        this.error.set('Failed to connect to the server');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  // Helper method for FormsModule to update signals
  updateLeaseMonths(val: number): void {
    const p = this.property();
    if (p && val >= (p.min_lease_months || 1)) {
      this.leaseMonths.set(val);
    }
  }

  updateCheckInDate(val: string): void {
    this.checkInDate.set(val);
  }

  updateNotes(val: string): void {
    this.notes.set(val);
  }

  confirmBooking(): void {
    const p = this.property();
    if (!p) return;

    this.isSubmitting.set(true);

    this.bookingService.createBooking({
      property_id: p.id,
      check_in_date: this.checkInDate(),
      lease_months: this.leaseMonths(),
      notes: this.notes()
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          alert('Booking request sent successfully!');
          this.router.navigate(['/dashboard/customer']);
        } else {
          alert('Error: ' + res.message);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        alert(err.error?.message || 'Failed to confirm booking. Please try again.');
      }
    });
  }
}
