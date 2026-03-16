import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-safety',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './safety.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .page-hero { background: linear-gradient(135deg, #EE2E24, #1a73e8); color: white; padding: 80px 0; }
    .safety-icon { font-size: 3rem; margin-bottom: 1.5rem; color: #EE2E24; }
    .safety-card { background: white; border-radius: 20px; padding: 35px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); height: 100%; transition: transform 0.3s; }
    .safety-card:hover { transform: translateY(-10px); }
  `]
})
export class SafetyComponent {}
