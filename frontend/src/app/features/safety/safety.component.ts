import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-safety',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './safety.component.html',
  styles: [`
    .safety-hero { background: linear-gradient(135deg, #0d7377, #14a085); color: white; padding: 80px 0; }
    .safety-card { background: white; border-radius: 16px; padding: 35px; box-shadow: 0 4px 20px rgba(0,0,0,0.07); height: 100%; border-left: 5px solid #14a085; }
    .safety-card h4 { font-weight: 700; color: #0d7377; }
    .safety-card i { font-size: 2.5rem; color: #14a085; margin-bottom: 20px; display: block; }
    .tip-item { display: flex; gap: 15px; margin-bottom: 20px; }
    .tip-icon { width: 48px; height: 48px; background: #e8f8f5; color: #14a085; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
    .tip-text h5 { font-weight: 700; margin-bottom: 5px; }
    .tip-text p { color: #5f6368; margin: 0; font-size: 0.95rem; }
    .emergency-box { background: linear-gradient(135deg, #EE2E24, #d42a20); color: white; border-radius: 16px; padding: 40px; }
    .emergency-box h3 { font-weight: 700; }
  `],
})
export class SafetyComponent {}
