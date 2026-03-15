import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="dashboard-page">
      <div class="dashboard-header py-4">
        <div class="container">
          <h2 class="fw-bold mb-0"><i class="fas fa-chart-line me-2"></i>Admin Panel</h2>
          <p class="mb-0 opacity-75">Platform Overview</p>
        </div>
      </div>

      <div class="container py-4">
        @if (loading) {
          <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        } @else {
          <!-- Platform Stats -->
          <div class="row g-3 mb-5">
            <div class="col-md-3">
              <div class="stat-card bg-primary text-white">
                <i class="fas fa-users fa-2x mb-2"></i>
                <h3>{{ data.userStats?.total_users || 0 }}</h3><p>Total Users</p>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-card bg-success text-white">
                <i class="fas fa-building fa-2x mb-2"></i>
                <h3>{{ data.propertyStats?.total_properties || 0 }}</h3><p>Properties</p>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-card bg-info text-white">
                <i class="fas fa-calendar-check fa-2x mb-2"></i>
                <h3>{{ data.bookingStats?.total_bookings || 0 }}</h3><p>Total Bookings</p>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-card" style="background: #f59e0b;">
                <i class="fas fa-rupee-sign fa-2x mb-2 text-white"></i>
                <h3 class="text-white">₹{{ data.revenueStats?.total_revenue | number }}</h3>
                <p class="text-white">Revenue</p>
              </div>
            </div>
          </div>

          <div class="row g-4">
            <!-- Recent Properties -->
            <div class="col-md-6">
              <div class="bg-white rounded-3 shadow-sm p-4">
                <h5 class="fw-bold mb-3">Recent Properties</h5>
                @for (p of data.recentProperties; track p['id']) {
                  <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                      <div class="fw-semibold">{{ p['title'] }}</div>
                      <small class="text-muted">{{ p['owner_name'] }} · {{ p['city'] }}</small>
                    </div>
                    <span class="badge" [ngClass]="p['status'] === 'active' ? 'bg-success' : 'bg-warning'">{{ p['status'] }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Recent Bookings -->
            <div class="col-md-6">
              <div class="bg-white rounded-3 shadow-sm p-4">
                <h5 class="fw-bold mb-3">Recent Bookings</h5>
                @for (b of data.recentBookings; track b['id']) {
                  <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                      <div class="fw-semibold">{{ b['customer_name'] }}</div>
                      <small class="text-muted">{{ b['property_title'] }}</small>
                    </div>
                    <span class="fw-bold text-primary">₹{{ b['monthly_rent'] | number }}/mo</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Breakdown Row -->
          <div class="row g-3 mt-2">
            <div class="col-md-4">
              <div class="bg-white rounded-3 shadow-sm p-3 text-center">
                <h6 class="text-muted">Customers</h6><h4>{{ data.userStats?.total_customers || 0 }}</h4>
              </div>
            </div>
            <div class="col-md-4">
              <div class="bg-white rounded-3 shadow-sm p-3 text-center">
                <h6 class="text-muted">Property Owners</h6><h4>{{ data.userStats?.total_owners || 0 }}</h4>
              </div>
            </div>
            <div class="col-md-4">
              <div class="bg-white rounded-3 shadow-sm p-3 text-center">
                <h6 class="text-muted">Pending Approvals</h6><h4>{{ data.propertyStats?.pending_properties || 0 }}</h4>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
    <app-footer></app-footer>
  `,
  styles: [`
    .dashboard-header { background: linear-gradient(135deg, #202124, #3c4043); color: white; }
    .stat-card { padding: 24px; border-radius: 16px; text-align: center; }
    .stat-card h3 { font-size: 2rem; font-weight: 700; margin: 0; }
    .stat-card p { margin: 0; opacity: 0.85; }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  loading = true;
  data: any = {};

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/dashboard/admin`).subscribe({
      next: (res: any) => { if (res.success) this.data = res.data; },
      error: () => {},
      complete: () => { this.loading = false; },
    });
  }
}
