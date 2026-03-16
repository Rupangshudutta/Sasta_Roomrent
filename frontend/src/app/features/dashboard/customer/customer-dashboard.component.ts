import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { finalize, catchError, of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { Booking } from '../../../shared/models/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
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
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    }
    .nav-tab {
      padding: 12px 24px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }
    .nav-tab.active {
      background: #EE2E24;
      color: white;
    }
    .reward-card {
      background: linear-gradient(45deg, #FFD700, #FFA500);
      color: #000;
      border: none;
    }
    .booking-card-premium {
      border: none;
      border-radius: 16px;
      overflow: hidden;
      transition: transform 0.3s;
    }
    .booking-card-premium:hover { transform: translateY(-5px); }
    .property-thumb {
      width: 120px; height: 100%;
      object-fit: cover;
    }
  `],
})
export class CustomerDashboardComponent implements OnInit {
  auth = inject(AuthService);
  private http = inject(HttpClient);

  // State Signals
  bookings = signal<Booking[]>([]);
  loading = signal(true);
  activeTab = signal<'active' | 'history' | 'saved'>('active');
  stats = signal({ total: 0, active: 0, completed: 0, favoritesCount: 0 });
  
  // Mock Pro Features
  walletBalance = signal(1250);
  membership = signal({ type: 'Sasta Premier', level: 'Silver', expiry: 'Dec 2026' });
  recommendations = signal([
    { id: 1, title: 'Luxury PG for Men', city: 'Bangalore', price: 8500, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400' },
    { id: 2, title: 'Premium Studio Flat', city: 'Pune', price: 15000, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400' }
  ]);

  ngOnInit(): void {
    this.fetchDashboardData();
  }

  fetchDashboardData() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/dashboard/customer`)
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err: any) => {
          if (err.status === 401) {
            console.warn('[Dashboard] Unauthorized, redirecting or clearing data');
            // Assuming auth service has a logout or token is invalid
            // Could redirect: this.router.navigate(['/login']);
          }
          return of({ success: false, data: null });
        })
      )
      .subscribe({
        next: (res: any) => {
          if (res.success && res.data) {
            const s = res.data.bookingStats;
            this.stats.set({ 
              total: s?.total || 0, 
              active: s?.active || 0, 
              completed: s?.completed || 0, 
              favoritesCount: res.data.favoritesCount || 0 
            });
            this.bookings.set(res.data.recentBookings || []);
          }
        }
      });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = { 
      pending: 'bg-warning', 
      confirmed: 'bg-primary', 
      active: 'bg-success', 
      completed: 'bg-secondary', 
      cancelled: 'bg-danger' 
    };
    return map[status.toLowerCase()] || 'bg-secondary';
  }

  switchTab(tab: 'active' | 'history' | 'saved') {
    this.activeTab.set(tab);
  }
}
