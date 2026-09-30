import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { PropertyService } from '../../../core/services/property.service';
import { BookingService } from '../../../core/services/booking.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { Booking, Property } from '../../../shared/models/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './owner-dashboard.component.html',
  styles: [`
    .dashboard-header { background: linear-gradient(135deg, #1A73E8, #0d5bba); color: white; }
    .stat-card { padding: 24px; border-radius: 16px; text-align: center; }
    .stat-card h3 { font-size: 2rem; font-weight: 700; margin: 0; }
    .stat-card p { margin: 0; opacity: 0.85; }
    .thumb { width: 56px; height: 42px; object-fit: cover; border-radius: 8px; }
  `],
})
export class OwnerDashboardComponent implements OnInit {
  auth = inject(AuthService);
  private http = inject(HttpClient);
  private propertyService = inject(PropertyService);
  private bookingService = inject(BookingService);

  loading = signal(true);
  error = signal('');
  properties = signal<Property[]>([]);
  bookings = signal<Booking[]>([]);
  busyBookingId = signal<number | null>(null);

  stats = computed(() => {
    const props = this.properties();
    const books = this.bookings();
    return {
      total: props.length,
      active: props.filter((p) => p.status === 'active').length,
      pending: props.filter((p) => p.status === 'pending').length,
      requests: books.filter((b) => b.status === 'pending').length,
      monthly_revenue: books.filter((b) => b.status === 'active').reduce((sum, b) => sum + Number(b.monthly_rent), 0),
    };
  });

  pendingRequests = computed(() => this.bookings().filter((b) => b.status === 'pending'));
  otherBookings = computed(() => this.bookings().filter((b) => b.status !== 'pending'));

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    let remaining = 2;
    const done = () => { if (--remaining === 0) this.loading.set(false); };

    this.propertyService.getMyProperties().subscribe({
      next: (res) => { if (res.success && res.data) this.properties.set(res.data.properties); },
      error: () => this.error.set('Could not load your listings.'),
      complete: done,
    });
    this.bookingService.getBookings().subscribe({
      next: (res) => { if (res.success && res.data) this.bookings.set(res.data.bookings); },
      error: () => this.error.set('Could not load booking requests.'),
      complete: done,
    });
  }

  confirm(b: Booking): void {
    if (!window.confirm(`Accept ${b.customer_name}'s request? Your phone number and email will be shared with them.`)) return;
    this.setStatus(b, 'confirmed');
  }

  decline(b: Booking): void {
    const reason = window.prompt('Reason for declining (optional):', 'Room no longer available') ?? undefined;
    if (reason === undefined) return;
    this.setStatus(b, 'cancelled', reason);
  }

  private setStatus(b: Booking, status: 'confirmed' | 'cancelled', reason?: string): void {
    this.busyBookingId.set(b.id);
    this.bookingService.updateStatus(b.id, status, reason).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.bookings.update((list) => list.map((x) => (x.id === b.id ? res.data!.booking : x)));
        }
        this.busyBookingId.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Could not update the booking.');
        this.busyBookingId.set(null);
      },
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = { pending: 'bg-warning text-dark', confirmed: 'bg-info text-dark', active: 'bg-success', completed: 'bg-secondary', cancelled: 'bg-danger', inactive: 'bg-secondary' };
    return map[status] || 'bg-secondary';
  }

  apiUrl = environment.apiUrl;
}
