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
  templateUrl: './customer-dashboard.component.html',
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
