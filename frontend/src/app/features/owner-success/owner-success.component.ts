import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-owner-success',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './owner-success.component.html',
  styles: [`
    .success-hero { background: linear-gradient(135deg, #EE2E24, #d42a20); color: white; padding: 80px 0; text-align: center; }
    .story-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 5px 25px rgba(0,0,0,0.09); height: 100%; }
    .story-card img { width: 100%; height: 200px; object-fit: cover; }
    .story-body { padding: 30px; }
    .story-body .owner-name { font-weight: 700; font-size: 1.15rem; }
    .story-body .earnings { background: #f0fdf4; color: #14a085; font-weight: 700; padding: 8px 16px; border-radius: 30px; display: inline-block; margin: 10px 0; }
    .story-body .quote { color: #555; font-style: italic; line-height: 1.7; }
    .stat-box { text-align: center; padding: 40px; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .stat-box .num { font-size: 3rem; font-weight: 800; color: #EE2E24; }
    .stat-box .label { color: #5f6368; font-size: 1rem; font-weight: 500; }
    .cta-section { background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 80px 0; border-radius: 24px; }
  `],
})
export class OwnerSuccessComponent {
  stories = [
    {
      image: 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600',
      name: 'Ramesh Kumar',
      city: 'Bangalore',
      earnings: '₹45,000/month',
      units: 3,
      quote: 'I have 3 rooms listed on Sasta Room and they are always occupied. The platform is transparent, the payments are on time, and the support team is excellent.',
    },
    {
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
      name: 'Priya Sharma',
      city: 'Mumbai',
      earnings: '₹30,000/month',
      units: 2,
      quote: 'After listing on Sasta Room, I found quality tenants in just 4 days. No brokers, no hassle. My rental income has become completely passive.',
    },
    {
      image: 'https://images.unsplash.com/photo-1502672260266-1c1c24240f38?w=600',
      name: 'Arjun Mehta',
      city: 'Delhi',
      earnings: '₹80,000/month',
      units: 5,
      quote: 'From 1 room to 5 units in two years — Sasta Room helped me scale my rental business systematically. The owner dashboard is superb.',
    },
  ];
}
