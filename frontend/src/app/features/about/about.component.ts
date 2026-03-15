import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './about.component.html',
  styles: [`
    .about-hero-section {
      position: relative;
      background: linear-gradient(135deg, #EE2E24, #d42a20);
      color: white;
      padding: 80px 0;
      overflow: hidden;
    }
    .trust-badge {
      background: white;
      border-radius: 15px;
      padding: 25px;
      text-align: center;
      box-shadow: 0 5px 20px rgba(0,0,0,0.1);
      height: 100%;
    }
    .trust-badge i { font-size: 3rem; color: var(--primary); margin-bottom: 15px; display: block; }
    .timeline { position: relative; padding: 50px 0; }
    .timeline::before {
      content: '';
      position: absolute;
      left: 50%; top: 0; bottom: 0;
      width: 3px; background: var(--primary);
      transform: translateX(-50%);
    }
    .timeline-item { margin-bottom: 50px; position: relative; }
    .timeline-content {
      background: white; padding: 30px;
      border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.08);
      width: 45%; position: relative;
    }
    .timeline-item:nth-child(odd) .timeline-content { margin-left: 55%; }
    .timeline-item:nth-child(even) .timeline-content { margin-right: 55%; text-align: right; }
    .timeline-badge {
      position: absolute; left: 50%; transform: translateX(-50%);
      width: 60px; height: 60px; background: var(--primary);
      border-radius: 50%; display: flex; align-items: center;
      justify-content: center; color: white; font-weight: 700;
      box-shadow: 0 0 0 4px white, 0 0 0 8px var(--primary);
    }
    .testimonial-card {
      background: white; border-radius: 15px; padding: 30px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.08); height: 100%;
    }
    .testimonial-card img { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; }
    @media (max-width: 768px) {
      .timeline::before { left: 30px; }
      .timeline-content { width: calc(100% - 80px); margin-left: 80px !important; text-align: left !important; }
      .timeline-badge { left: 30px; }
    }
  `],
})
export class AboutComponent {}
