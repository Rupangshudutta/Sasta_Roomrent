import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './privacy.component.html',
  styles: [`
    .page-hero { background: linear-gradient(135deg, #0f3460, #16213e); color: white; padding: 60px 0; }
    .toc { position: sticky; top: 90px; background: white; border-radius: 16px; padding: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .toc-link { display: block; padding: 8px 12px; color: #5f6368; text-decoration: none; border-radius: 8px; font-size: 0.9rem; }
    .toc-link:hover { background: #e8f0fe; color: #1a73e8; font-weight: 600; }
    .content-section { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 25px; }
    .content-section h2 { color: #0f3460; font-weight: 700; padding-bottom: 15px; border-bottom: 3px solid #1a73e8; margin-bottom: 20px; }
    .content-section p, .content-section li { color: #444; line-height: 1.9; }
    .data-table { border-radius: 12px; overflow: hidden; }
    .data-table th { background: #0f3460; color: white; }
  `],
})
export class PrivacyComponent {
  lastUpdated = 'March 15, 2026';
}
