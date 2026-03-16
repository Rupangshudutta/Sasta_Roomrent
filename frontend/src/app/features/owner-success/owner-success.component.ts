import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-owner-success',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './owner-success.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .success-hero { background: linear-gradient(135deg, #00b09b, #96c93d); color: white; padding: 80px 0; }
    .success-card { border: none; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); transition: transform 0.3s; overflow: hidden; }
    .success-card:hover { transform: scale(1.02); }
    .quote-icon { font-size: 2rem; color: #00b09b; opacity: 0.3; }
  `]
})
export class OwnerSuccessComponent {
  stories = [
    {
      name: 'Rajesh Mittal',
      city: 'Delhi',
      earnings: '₹45,000/mo',
      units: 3,
      quote: 'Sasta Room helped me find verified students for my 3BHK within a week. No more dealing with annoying brokers!',
      image: 'https://i.pravatar.cc/150?img=12'
    },
    {
      name: 'Sunita Sharma',
      city: 'Bangalore',
      earnings: '₹85,000/mo',
      units: 5,
      quote: 'The payment transparency is what I love most. Tenants pay on time and the verification process is top-notch.',
      image: 'https://i.pravatar.cc/150?img=32'
    },
    {
      name: 'Vikram Singh',
      city: 'Pune',
      earnings: '₹28,000/mo',
      units: 2,
      quote: 'I was struggling to find professional bachelors for my flats. Sasta Room connected me with genuine tenants instantly.',
      image: 'https://i.pravatar.cc/150?img=11'
    }
  ];
}
