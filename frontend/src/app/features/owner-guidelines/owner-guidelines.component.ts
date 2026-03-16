import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-owner-guidelines',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './owner-guidelines.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .guidelines-hero { background: linear-gradient(135deg, #1e3c72, #2a5298); color: white; padding: 70px 0; }
    .content-section { max-width: 900px; margin: 0 auto; background: white; border-radius: 20px; padding: 45px; box-shadow: 0 5px 25px rgba(0,0,0,0.06); }
    .badge-number { width: 32px; height: 32px; border-radius: 50%; background: #EE2E24; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; }
  `]
})
export class OwnerGuidelinesComponent {}
