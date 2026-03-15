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
  templateUrl: './admin-dashboard.component.html',
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
