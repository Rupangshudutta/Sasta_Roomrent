import { Component } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>

    <!-- Hero Section -->
    <section class="contact-hero-section">
      <div class="container">
        <h1 class="display-4 fw-bold mb-3">Get In Touch</h1>
        <p class="lead fs-4">We're here to help you find your perfect room</p>
      </div>
    </section>

    <!-- Quick Contact Cards -->
    <section class="contact-cards pb-5">
      <div class="container">
        <div class="row g-4">
          <div class="col-lg-4 col-md-6">
            <div class="quick-contact">
              <div class="icon"><i class="fas fa-phone-alt"></i></div>
              <h3>Call Us Now</h3>
              <p class="text-muted">Available 24/7 for your queries</p>
              <a href="tel:+918800123456" class="contact-link">+91 88001 23456</a>
              <p class="small text-muted mt-2">Toll-free | Instant Support</p>
            </div>
          </div>
          <div class="col-lg-4 col-md-6">
            <div class="quick-contact">
              <div class="icon"><i class="fab fa-whatsapp"></i></div>
              <h3>WhatsApp Chat</h3>
              <p class="text-muted">Get instant replies on WhatsApp</p>
              <a href="https://wa.me/918800123456" class="contact-link" target="_blank">Start Chat</a>
              <p class="small text-muted mt-2">Fastest Response Time</p>
            </div>
          </div>
          <div class="col-lg-4 col-md-6">
            <div class="quick-contact">
              <div class="icon"><i class="fas fa-envelope"></i></div>
              <h3>Email Support</h3>
              <p class="text-muted">We reply within 2 hours</p>
              <a href="mailto:support@sastaroom.com" class="contact-link">support&#64;sastaroom.com</a>
              <p class="small text-muted mt-2">Detailed Assistance</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Form & Info -->
    <section class="py-5">
      <div class="container">
        <div class="row g-4">
          <div class="col-lg-7">
            <div class="form-section">
              <h2 class="fw-bold mb-2">Send Us a Message</h2>
              <p class="text-muted mb-4">Fill out the form and we'll get back to you within 2 hours</p>

              <div id="successMsg" [style.display]="submitted ? 'block' : 'none'" class="success-message">
                <i class="fas fa-check-circle me-2"></i>Message sent successfully! We'll contact you soon.
              </div>

              <form (ngSubmit)="submitForm($event)">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Your Name *</label>
                    <input type="text" class="form-control" placeholder="John Doe" required>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Phone Number *</label>
                    <input type="tel" class="form-control" placeholder="+91 98765 43210" required>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Email Address *</label>
                    <input type="email" class="form-control" placeholder="john&#64;example.com" required>
                  </div>
                  <div class="col-12">
                    <label class="form-label">I'm looking for *</label>
                    <select class="form-select" required>
                      <option value="">Select an option</option>
                      <option value="pg">PG Accommodation</option>
                      <option value="shared">Shared Room</option>
                      <option value="single">Single Room</option>
                      <option value="flat">Flat/Apartment</option>
                      <option value="owner">I'm a Property Owner</option>
                      <option value="other">Other Query</option>
                    </select>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Your Message *</label>
                    <textarea class="form-control" rows="5" placeholder="Tell us how we can help you..." required></textarea>
                  </div>
                  <div class="col-12">
                    <button type="submit" class="btn btn-primary w-100">
                      <i class="fas fa-paper-plane me-2"></i>Send Message
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div class="col-lg-5">
            <div class="info-box">
              <div class="info-item">
                <i class="fas fa-clock d-block"></i>
                <h4>Response Time</h4>
                <p class="text-muted mb-0">Average response time: <strong class="text-primary">Under 2 Hours</strong></p>
                <p class="text-muted small">We're committed to helping you quickly</p>
              </div>
              <div class="info-item">
                <i class="fas fa-map-marker-alt d-block"></i>
                <h4>Head Office</h4>
                <p class="text-muted mb-1"><strong>Bangalore, India</strong></p>
                <p class="text-muted small mb-0">123, MG Road, Koramangala<br>Bangalore, Karnataka - 560034</p>
              </div>
              <div class="info-item">
                <i class="fas fa-business-time d-block"></i>
                <h4>Working Hours</h4>
                <p class="text-muted mb-0">Phone Support: <strong>24/7</strong></p>
                <p class="text-muted mb-0">Office: <strong>Mon-Sat, 9 AM - 7 PM</strong></p>
              </div>
              <div class="info-item">
                <i class="fas fa-share-alt d-block"></i>
                <h4>Follow Us</h4>
                <div class="d-flex gap-3 mt-3">
                  <a href="#" class="text-primary fs-4"><i class="fab fa-facebook"></i></a>
                  <a href="#" class="text-info fs-4"><i class="fab fa-twitter"></i></a>
                  <a href="#" class="text-danger fs-4"><i class="fab fa-instagram"></i></a>
                  <a href="#" class="text-primary fs-4"><i class="fab fa-linkedin"></i></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="faq-section py-5">
      <div class="container">
        <div class="text-center mb-5">
          <h2 class="fw-bold mb-3">Frequently Asked Questions</h2>
          <p class="text-muted">Quick answers to common questions</p>
        </div>
        <div class="row justify-content-center">
          <div class="col-lg-8">
            @for (faq of faqs; track faq.q) {
              <div class="faq-item">
                <div class="faq-question" (click)="toggleFaq(faq)" [class.active]="faq.open">
                  <span>{{ faq.q }}</span>
                  <i class="fas fa-chevron-down"></i>
                </div>
                <div class="faq-answer" [class.active]="faq.open">
                  <p>{{ faq.a }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </section>

    <app-footer></app-footer>
  `,
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
