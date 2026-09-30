import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { PropertyService } from '../../../core/services/property.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';
import { Booking, Property } from '../../../shared/models/models';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent, PropertyCardComponent],
  templateUrl: './customer-dashboard.component.html',
  styles: [`
    :host { display: block; background-color: #f7f8fa; min-height: 100vh; }
    .premium-header {
      background: linear-gradient(90deg, var(--primary), #d42a20);
      color: white;
      padding: 60px 0 100px;
      margin-bottom: -60px;
    }
    .profile-avatar {
      width: 80px; height: 80px;
      background: #EE2E24;
      color: white;
      font-size: 2rem;
      font-weight: 700;
      border: 4px solid rgba(255,255,255,0.2);
    }
    .glass-card {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    }
    .nav-tab { padding: 12px 24px; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
    .nav-tab.active { background: #EE2E24; color: white; }
    .booking-card { border: none; border-radius: 16px; overflow: hidden; }
    .contact-box { background: #e8f5e9; border-radius: 12px; }
  `],
})
export class CustomerDashboardComponent implements OnInit {
  auth = inject(AuthService);
  private bookingService = inject(BookingService);
  private propertyService = inject(PropertyService);

  bookings = signal<Booking[]>([]);
  favorites = signal<Property[]>([]);
  loading = signal(true);
  error = signal('');
  activeTab = signal<'active' | 'history' | 'saved'>('active');
  busyId = signal<number | null>(null);

  ongoing = computed(() => this.bookings().filter((b) => ['pending', 'confirmed', 'active'].includes(b.status)));
  history = computed(() => this.bookings().filter((b) => ['completed', 'cancelled'].includes(b.status)));
  visibleBookings = computed(() => (this.activeTab() === 'active' ? this.ongoing() : this.history()));
  stats = computed(() => ({
    total: this.bookings().length,
    active: this.ongoing().length,
    completed: this.history().filter((b) => b.status === 'completed').length,
    favoritesCount: this.favorites().length,
  }));

  ngOnInit(): void {
    this.bookingService.getBookings().subscribe({
      next: (res) => { if (res.success && res.data) this.bookings.set(res.data.bookings); },
      error: () => this.error.set('Could not load your bookings.'),
      complete: () => this.loading.set(false),
    });
    this.propertyService.getFavorites().subscribe({
      next: (res) => { if (res.success && res.data) this.favorites.set(res.data.properties); },
      error: () => {},
    });
  }

  cancel(b: Booking): void {
    if (!window.confirm('Withdraw this booking request?')) return;
    this.busyId.set(b.id);
    this.bookingService.cancelBooking(b.id, 'Withdrawn by tenant').subscribe({
      next: () => {
        this.bookings.update((list) => list.map((x) => (x.id === b.id ? { ...x, status: 'cancelled' } : x)));
        this.busyId.set(null);
      },
      error: (err) => { this.error.set(err.error?.message || 'Could not cancel.'); this.busyId.set(null); },
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Waiting for owner', confirmed: 'Accepted by owner', active: 'Moved in', completed: 'Completed', cancelled: 'Declined / cancelled',
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = { pending: 'bg-warning text-dark', confirmed: 'bg-success', active: 'bg-primary', completed: 'bg-secondary', cancelled: 'bg-danger' };
    return map[status] || 'bg-secondary';
  }

  switchTab(tab: 'active' | 'history' | 'saved') { this.activeTab.set(tab); }
}
