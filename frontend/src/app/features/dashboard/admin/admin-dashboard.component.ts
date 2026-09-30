import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { PropertyService } from '../../../core/services/property.service';
import { ApiResponse, ContactMessage, Property } from '../../../shared/models/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './admin-dashboard.component.html',
  styles: [`
    .dashboard-header { background: linear-gradient(135deg, #202124, #3c4043); color: white; }
    .stat-card { padding: 24px; border-radius: 16px; text-align: center; }
    .stat-card h3 { font-size: 2rem; font-weight: 700; margin: 0; }
    .stat-card p { margin: 0; opacity: 0.85; }
    .thumb { width: 96px; height: 72px; object-fit: cover; border-radius: 10px; }
    .msg { border-left: 4px solid #EE2E24; }
    .msg.read { border-left-color: #dee2e6; opacity: 0.7; }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private propertyService = inject(PropertyService);

  loading = signal(true);
  error = signal('');
  data = signal<any>({});
  pending = signal<Property[]>([]);
  messages = signal<ContactMessage[]>([]);
  busyId = signal<number | null>(null);

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/dashboard/admin`).subscribe({
      next: (res) => { if (res.success) this.data.set(res.data); },
      error: () => this.error.set('Could not load platform stats.'),
      complete: () => this.loading.set(false),
    });
    this.loadPending();
    this.http.get<ApiResponse<{ messages: ContactMessage[] }>>(`${environment.apiUrl}/contact`).subscribe({
      next: (res) => { if (res.success && res.data) this.messages.set(res.data.messages); },
      error: () => {},
    });
  }

  loadPending(): void {
    this.propertyService.getPending().subscribe({
      next: (res) => { if (res.success && res.data) this.pending.set(res.data.properties); },
      error: () => this.error.set('Could not load pending listings.'),
    });
  }

  approve(p: Property): void { this.moderate(p, 'active'); }

  reject(p: Property): void {
    if (!window.confirm(`Reject "${p.title}"? The owner will not see it on the site.`)) return;
    this.moderate(p, 'inactive');
  }

  private moderate(p: Property, status: 'active' | 'inactive'): void {
    this.busyId.set(p.id);
    this.propertyService.setStatus(p.id, status).subscribe({
      next: () => {
        this.pending.update((list) => list.filter((x) => x.id !== p.id));
        this.busyId.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Could not update the listing.');
        this.busyId.set(null);
      },
    });
  }

  markRead(m: ContactMessage): void {
    this.http.patch<ApiResponse>(`${environment.apiUrl}/contact/${m.id}/read`, {}).subscribe({
      next: () => this.messages.update((list) => list.map((x) => (x.id === m.id ? { ...x, is_read: true } : x))),
    });
  }
}
