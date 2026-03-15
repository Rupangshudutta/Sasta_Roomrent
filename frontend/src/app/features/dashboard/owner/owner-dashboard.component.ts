import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="dashboard-page">
      <div class="dashboard-header py-4">
        <div class="container d-flex justify-content-between align-items-center">
          <div>
            <h2 class="fw-bold mb-0">Owner Dashboard</h2>
            <p class="mb-0 opacity-75">Welcome back, {{ auth.user()?.first_name }}!</p>
          </div>
          <a routerLink="/properties/add" class="btn btn-light fw-bold">
            <i class="fas fa-plus me-2"></i>Add Property
          </a>
        </div>
      </div>

      <div class="container py-4">
        <!-- Stats -->
        <div class="row g-3 mb-5">
          <div class="col-md-4">
            <div class="stat-card bg-primary text-white">
              <i class="fas fa-building fa-2x mb-2"></i>
              <h3>{{ stats.total }}</h3><p>Total Properties</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="stat-card bg-success text-white">
              <i class="fas fa-check-circle fa-2x mb-2"></i>
              <h3>{{ stats.active }}</h3><p>Active Listings</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="stat-card" style="background: #6f42c1;" class="text-white">
              <i class="fas fa-rupee-sign fa-2x mb-2"></i>
              <h3>₹{{ stats.monthly_revenue | number }}</h3><p>Monthly Revenue</p>
            </div>
          </div>
        </div>

        <!-- Recent Bookings -->
        <h4 class="fw-bold mb-3">Recent Booking Requests</h4>
        @if (loading) {
          <div class="text-center py-4"><div class="spinner-border text-primary"></div></div>
        } @else if (bookings.length > 0) {
          <div class="table-responsive bg-white rounded-3 shadow-sm p-3">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Tenant</th><th>Property</th><th>Check In</th><th>Rent</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (b of bookings; track b.id) {
                  <tr>
                    <td>{{ b['customer_name'] }}</td>
                    <td>{{ b['property_title'] }}</td>
                    <td>{{ b.check_in_date | date:'mediumDate' }}</td>
                    <td class="text-primary fw-bold">₹{{ b.monthly_rent | number }}</td>
                    <td><span class="badge" [ngClass]="getStatusClass(b.status)">{{ b.status }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="text-center py-5">
            <i class="fas fa-inbox fa-4x text-muted mb-3"></i>
            <h5>No booking requests yet</h5>
          </div>
        }
      </div>
    </div>
    <app-footer></app-footer>
  `,
  styles: [`
    .dashboard-header { background: linear-gradient(135deg, #1A73E8, #0d5bba); color: white; }
    .stat-card { padding: 24px; border-radius: 16px; text-align: center; }
    .stat-card h3 { font-size: 2rem; font-weight: 700; margin: 0; }
    .stat-card p { margin: 0; opacity: 0.85; }
  `],
})
export class OwnerDashboardComponent implements OnInit {
  auth = inject(AuthService);
  private http = inject(HttpClient);

  bookings: any[] = [];
  loading = true;
  stats = { total: 0, active: 0, pending: 0, monthly_revenue: 0 };

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/dashboard/owner`).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.stats = { ...res.data.propStats, ...res.data.bookingStats };
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
