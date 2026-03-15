import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { PropertyService } from '../../../core/services/property.service';
import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { Booking } from '../../../shared/models/models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="dashboard-page">
      <div class="dashboard-header py-4">
        <div class="container">
          <h2 class="fw-bold mb-0">Welcome, {{ auth.user()?.first_name }}!</h2>
          <p class="text-muted">Manage your bookings and favorites</p>
        </div>
      </div>

      <div class="container py-4">
        <!-- Stats -->
        <div class="row g-3 mb-5">
          <div class="col-md-3">
            <div class="stat-card bg-primary text-white">
              <i class="fas fa-calendar-check fa-2x mb-2"></i>
              <h3>{{ stats.total }}</h3><p>Total Bookings</p>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card bg-success text-white">
              <i class="fas fa-home fa-2x mb-2"></i>
              <h3>{{ stats.active }}</h3><p>Active Stays</p>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card bg-info text-white">
              <i class="fas fa-heart fa-2x mb-2"></i>
              <h3>{{ stats.favoritesCount }}</h3><p>Saved Properties</p>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card bg-warning text-white">
              <i class="fas fa-clock fa-2x mb-2"></i>
              <h3>{{ stats.completed }}</h3><p>Completed Stays</p>
            </div>
          </div>
        </div>

        <!-- My Bookings -->
        <h4 class="fw-bold mb-3">My Bookings</h4>
        @if (loading) {
          <div class="text-center py-4"><div class="spinner-border text-primary"></div></div>
        } @else if (bookings.length > 0) {
          <div class="row g-3">
            @for (booking of bookings; track booking.id) {
              <div class="col-md-6">
                <div class="booking-card p-4 rounded-3 border bg-white">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="mb-0">{{ booking.property_title }}</h5>
                    <span class="badge" [ngClass]="getStatusClass(booking.status)">{{ booking.status }}</span>
                  </div>
                  <p class="text-muted small mb-2"><i class="fas fa-map-marker-alt me-1"></i>{{ booking.property_city }}</p>
                  <div class="d-flex justify-content-between">
                    <span><i class="fas fa-calendar me-1"></i>{{ booking.check_in_date | date:'mediumDate' }}</span>
                    <span class="fw-bold text-primary">₹{{ booking.monthly_rent | number }}/mo</span>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="text-center py-5">
            <i class="fas fa-calendar-times fa-4x text-muted mb-3"></i>
            <h5>No bookings yet</h5>
            <a routerLink="/properties" class="btn btn-primary mt-2">Browse Properties</a>
          </div>
        }
      </div>
    </div>
    <app-footer></app-footer>
  `,
  styles: [`
    .dashboard-header { background: linear-gradient(135deg, #EE2E24, #c0392b); color: white; }
    .stat-card { padding: 24px; border-radius: 16px; text-align: center; }
    .stat-card h3 { font-size: 2rem; font-weight: 700; margin: 0; }
    .stat-card p { margin: 0; opacity: 0.85; }
    .booking-card { transition: box-shadow 0.2s; }
    .booking-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
  `],
})
export class CustomerDashboardComponent implements OnInit {
  auth = inject(AuthService);
  private bookingService = inject(BookingService);
  private http = inject(HttpClient);

  bookings: Booking[] = [];
  loading = true;
  stats = { total: 0, active: 0, completed: 0, favoritesCount: 0 };

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/dashboard/customer`).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const s = res.data.bookingStats;
          this.stats = { total: s.total || 0, active: s.active || 0, completed: s.completed || 0, favoritesCount: res.data.favoritesCount || 0 };
          this.bookings = res.data.recentBookings || [];
        }
      },
      error: () => {},
      complete: () => { this.loading = false; },
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = { pending: 'bg-warning', confirmed: 'bg-info', active: 'bg-success', completed: 'bg-secondary', cancelled: 'bg-danger' };
    return map[status] || 'bg-secondary';
  }
}
