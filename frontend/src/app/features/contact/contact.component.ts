import { Component } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './contact.component.html',
  styles: [`
    .contact-hero-section {
      background: linear-gradient(135deg, #EE2E24, #d42a20);
      color: white;
      padding: 60px 0 120px;
      text-align: center;
    }
    .contact-cards { margin-top: -80px; position: relative; z-index: 10; }
    .quick-contact {
      background: white; border-radius: 20px; padding: 40px 30px;
      text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      transition: all 0.3s; height: 100%; border: 3px solid transparent;
    }
    .quick-contact:hover {
      transform: translateY(-10px); border-color: #EE2E24;
      box-shadow: 0 20px 60px rgba(238,46,36,0.2);
    }
    .quick-contact .icon {
      width: 80px; height: 80px; margin: 0 auto 20px;
      background: linear-gradient(135deg, #EE2E24, #d42a20);
      border-radius: 50%; display: flex;
      align-items: center; justify-content: center;
      font-size: 2rem; color: white;
    }
    .quick-contact h3 { font-size: 1.5rem; margin-bottom: 10px; font-weight: 700; }
    .contact-link {
      font-size: 1.3rem; color: #EE2E24; font-weight: 600;
      text-decoration: none; display: inline-block; margin: 15px 0;
    }
    .contact-link:hover { color: #d42a20; }
    .form-section {
      background: white; border-radius: 20px; padding: 50px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
    }
    .form-control, .form-select {
      padding: 15px 20px; border-radius: 12px;
      border: 2px solid #e8e8e8; font-size: 1rem; transition: all 0.3s;
    }
    .form-control:focus, .form-select:focus {
      border-color: #EE2E24;
      box-shadow: 0 0 0 4px rgba(238,46,36,0.1); outline: none;
    }
    .form-label { font-weight: 600; margin-bottom: 8px; }
    .info-box {
      background: linear-gradient(135deg, rgba(238,46,36,0.05), rgba(26,115,232,0.05));
      border-radius: 20px; padding: 40px; height: 100%;
    }
    .info-item { margin-bottom: 30px; padding-bottom: 30px; border-bottom: 2px solid rgba(0,0,0,0.05); }
    .info-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .info-item i { font-size: 1.8rem; color: #EE2E24; margin-bottom: 15px; }
    .info-item h4 { font-weight: 700; margin-bottom: 10px; }
    .faq-section { background: #F8F9FA; }
    .faq-item {
      background: white; border-radius: 15px; margin-bottom: 15px;
      overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    .faq-question {
      padding: 25px 30px; cursor: pointer; font-weight: 600; font-size: 1.1rem;
      display: flex; justify-content: space-between; align-items: center; user-select: none;
    }
    .faq-question:hover { background: #F8F9FA; }
    .faq-question i { color: #EE2E24; transition: transform 0.3s; }
    .faq-question.active i { transform: rotate(180deg); }
    .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; padding: 0 30px; }
    .faq-answer.active { max-height: 500px; padding: 0 30px 25px; }
    .faq-answer p { color: #5F6368; line-height: 1.8; }
    .success-message {
      background: #34A853; color: white; padding: 20px;
      border-radius: 12px; margin-bottom: 20px; text-align: center; font-weight: 600;
    }

    @media (max-width: 768px) {
      .contact-hero-section { padding: 40px 0 100px; }
      .form-section { padding: 30px 20px; }
      .info-box { padding: 30px 20px; margin-top: 30px; }
    }
  `],
})
export class ContactComponent {
  submitted = false;

  faqs = [
    { q: 'How quickly can I find a room?', a: 'Most users find their perfect room within 2-3 days. You can browse properties instantly, contact owners directly, and schedule visits the same day. Our verified listings ensure you don\'t waste time on fake properties.', open: false },
    { q: 'Do I need to pay any brokerage?', a: 'Absolutely not! Sasta Room is 100% broker-free. You connect directly with property owners. No hidden charges, no brokerage fees. Save thousands of rupees that you would otherwise pay to brokers.', open: false },
    { q: 'Are all properties verified?', a: 'Yes! Every single property is physically verified by our team. We check ownership documents, visit the property, verify amenities, and ensure all photos are authentic. Your safety and trust are our priority.', open: false },
    { q: 'What if I need to cancel my booking?', a: 'We have a flexible cancellation policy. If you cancel before moving in, you get a full refund minus processing charges. After moving in, refunds depend on the agreement with the owner. Contact our support team for assistance.', open: false },
    { q: 'How do I list my property?', a: 'It\'s simple! Click "List Your Property", fill in details, upload photos, and submit. Our team will verify your property within 24-48 hours. Listing is completely free. You only pay a small commission when you get a tenant.', open: false },
    { q: 'Is my payment information secure?', a: '100% secure! We use Razorpay, India\'s most trusted payment gateway with bank-grade encryption. We never store your card details. All transactions are PCI-DSS compliant and protected by SSL encryption.', open: false },
  ];

  toggleFaq(faq: any) {
    faq.open = !faq.open;
  }

  submitForm(e: Event) {
    e.preventDefault();
    this.submitted = true;
    (e.target as HTMLFormElement).reset();
    setTimeout(() => this.submitted = false, 5000);
  }
}
