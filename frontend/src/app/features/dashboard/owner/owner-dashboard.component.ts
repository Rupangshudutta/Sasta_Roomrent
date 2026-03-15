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
  templateUrl: './owner-dashboard.component.html',
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
