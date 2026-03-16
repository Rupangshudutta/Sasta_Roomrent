import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './terms.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .page-hero { background: linear-gradient(135deg, #2d3436, #000000); color: white; padding: 60px 0; }
    .content-card { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 25px rgba(0,0,0,0.05); }
    h2 { color: #d63031; font-weight: 700; margin-top: 30px; margin-bottom: 20px; border-left: 4px solid #d63031; padding-left: 15px; }
    p, li { line-height: 1.8; color: #4b4b4b; }
    .last-updated { background: #f8f9fa; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; margin-bottom: 30px; display: inline-block; }
  `]
})
export class TermsComponent {
  lastUpdated = 'March 15, 2026';
}
