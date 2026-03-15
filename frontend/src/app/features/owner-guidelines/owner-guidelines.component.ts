import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-owner-guidelines',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './owner-guidelines.component.html',
  styles: [`
    .page-hero { background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 80px 0; }
    .guideline-card { background: white; border-radius: 16px; padding: 35px; box-shadow: 0 4px 20px rgba(0,0,0,0.07); height: 100%; }
    .guideline-card .icon { width: 64px; height: 64px; background: linear-gradient(135deg, #EE2E24, #d42a20); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; margin-bottom: 20px; }
    .guideline-card h4 { font-weight: 700; color: #1a1a1a; }
    .req-list li { padding: 10px 0; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 10px; color: #444; }
    .req-list li:last-child { border-bottom: none; }
    .req-list li i { color: #EE2E24; }
    .commission-table th { background: #EE2E24; color: white; }
    .do-dont { border-radius: 16px; overflow: hidden; }
    .do-col { background: #e8f8f0; padding: 30px; }
    .dont-col { background: #fde8e8; padding: 30px; }
    .do-item, .dont-item { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 0.95rem; }
    .do-item i { color: #34A853; }
    .dont-item i { color: #EE2E24; }
  `],
})
export class OwnerGuidelinesComponent {}
