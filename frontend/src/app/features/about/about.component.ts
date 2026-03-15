import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>

    <!-- Hero Section -->
    <section class="about-hero-section">
      <div class="container text-center hero-inner">
        <h1 class="display-4 fw-bold mb-3">Finding Your Perfect Room<br>Shouldn't Be This Hard</h1>
        <p class="lead fs-5">We're changing that. One verified property at a time.</p>
        <div class="d-flex justify-content-center gap-3 mt-4">
          <a routerLink="/properties" class="btn btn-light btn-lg">
            <i class="fas fa-search me-2"></i>Browse Properties
          </a>
          <a routerLink="/auth/register" class="btn btn-outline-light btn-lg">
            <i class="fas fa-user-plus me-2"></i>Sign Up Free
          </a>
        </div>
      </div>
    </section>

    <!-- Problem & Solution -->
    <section class="py-5">
      <div class="container">
        <div class="row align-items-center mb-5">
          <div class="col-lg-6 mb-4 mb-lg-0">
            <h2 class="fw-bold mb-4">The Problem We Saw</h2>
            <p class="lead">In 2020, we noticed something broken in the rental market:</p>
            <ul class="fs-5">
              <li class="mb-3">Students paying brokers ₹5,000-10,000 just to see rooms</li>
              <li class="mb-3">Fake listings with photos from Google</li>
              <li class="mb-3">Owners struggling to find genuine tenants</li>
              <li class="mb-3">No transparency in pricing or amenities</li>
            </ul>
          </div>
          <div class="col-lg-6">
            <img src="https://images.unsplash.com/photo-1560448204-603b3fc33ddc?ixlib=rb-4.0.3" alt="Problem" class="img-fluid rounded shadow" loading="lazy">
          </div>
        </div>

        <div class="row align-items-center">
          <div class="col-lg-6 order-lg-2 mb-4 mb-lg-0">
            <h2 class="fw-bold mb-4">Our Solution</h2>
            <p class="lead">A platform where:</p>
            <ul class="fs-5">
              <li class="mb-3"><strong>Zero broker fees</strong> - Direct connection with owners</li>
              <li class="mb-3"><strong>100% verified</strong> - Every property physically verified</li>
              <li class="mb-3"><strong>Real photos</strong> - What you see is what you get</li>
              <li class="mb-3"><strong>Transparent pricing</strong> - No hidden charges</li>
            </ul>
          </div>
          <div class="col-lg-6 order-lg-1">
            <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3" alt="Solution" class="img-fluid rounded shadow" loading="lazy">
          </div>
        </div>
      </div>
    </section>

    <!-- Trust Badges -->
    <section class="py-5" style="background: var(--neutral);">
      <div class="container">
        <h2 class="text-center fw-bold mb-5">Why Students & Professionals Trust Us</h2>
        <div class="row g-4">
          <div class="col-md-3 col-sm-6">
            <div class="trust-badge">
              <i class="fas fa-shield-alt"></i>
              <h4>Verified Properties</h4>
              <p class="mb-0">Every listing verified by our team</p>
            </div>
          </div>
          <div class="col-md-3 col-sm-6">
            <div class="trust-badge">
              <i class="fas fa-rupee-sign"></i>
              <h4>Zero Brokerage</h4>
              <p class="mb-0">Save thousands in broker fees</p>
            </div>
          </div>
          <div class="col-md-3 col-sm-6">
            <div class="trust-badge">
              <i class="fas fa-headset"></i>
              <h4>24/7 Support</h4>
              <p class="mb-0">Real humans, real help</p>
            </div>
          </div>
          <div class="col-md-3 col-sm-6">
            <div class="trust-badge">
              <i class="fas fa-lock"></i>
              <h4>Secure Payments</h4>
              <p class="mb-0">Bank-grade security</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Journey Timeline -->
    <section class="py-5">
      <div class="container">
        <h2 class="text-center fw-bold mb-5">Our Journey So Far</h2>
        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-badge">2020</div>
            <div class="timeline-content">
              <h4>Started in a Bangalore PG</h4>
              <p>Three roommates frustrated with the rental process decided to build something better. Started with just 50 properties in Bangalore.</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-badge">2021</div>
            <div class="timeline-content">
              <h4>First 1,000 Happy Customers</h4>
              <p>Expanded to Mumbai and Delhi. Word spread fast - students started recommending us to friends. Zero marketing budget, pure word-of-mouth.</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-badge">2022</div>
            <div class="timeline-content">
              <h4>Went Pan-India</h4>
              <p>Launched in 25 cities. Introduced instant booking and virtual tours. Helped 50,000+ people find homes during this year alone.</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-badge">2023</div>
            <div class="timeline-content">
              <h4>Crossed 1 Million Users</h4>
              <p>Became one of India's fastest-growing rental platforms. Launched mobile app. Added AI-powered recommendations.</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-badge">2024</div>
            <div class="timeline-content">
              <h4>Today</h4>
              <p><strong>50,000+ properties | 100+ cities | 2M+ users</strong><br>Still growing, still improving, still focused on making renting easier for you.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="py-5" style="background: var(--neutral);">
      <div class="container">
        <h2 class="text-center fw-bold mb-5">What Our Users Say</h2>
        <div class="row g-4">
          <div class="col-md-4">
            <div class="testimonial-card">
              <div class="d-flex align-items-center mb-3">
                <img src="https://i.pravatar.cc/150?img=1" alt="User" loading="lazy">
                <div class="ms-3">
                  <h5 class="mb-0">Rahul Sharma</h5>
                  <small class="text-muted">Engineering Student, Bangalore</small>
                </div>
              </div>
              <p>"Saved ₹8,000 in broker fees! Found my PG in 2 days. The photos were exactly like the actual room. Highly recommend!"</p>
              <div class="text-warning">★★★★★</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="testimonial-card">
              <div class="d-flex align-items-center mb-3">
                <img src="https://i.pravatar.cc/150?img=5" alt="User" loading="lazy">
                <div class="ms-3">
                  <h5 class="mb-0">Priya Patel</h5>
                  <small class="text-muted">Software Engineer, Pune</small>
                </div>
              </div>
              <p>"Best decision ever! Direct contact with owner, transparent pricing, and the support team actually responds. No more broker harassment."</p>
              <div class="text-warning">★★★★★</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="testimonial-card">
              <div class="d-flex align-items-center mb-3">
                <img src="https://i.pravatar.cc/150?img=8" alt="User" loading="lazy">
                <div class="ms-3">
                  <h5 class="mb-0">Amit Kumar</h5>
                  <small class="text-muted">MBA Student, Delhi</small>
                </div>
              </div>
              <p>"Found a great flat near my college. The virtual tour feature saved me so much time. Moved in within a week!"</p>
              <div class="text-warning">★★★★★</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Team Section -->
    <section class="py-5">
      <div class="container">
        <h2 class="text-center fw-bold mb-3">Built By Real People</h2>
        <p class="text-center text-muted mb-5">Not a faceless corporation. Just a team that cares.</p>
        <div class="row g-4 mb-5">
          <div class="col-md-4">
            <div class="text-center">
              <div class="mx-auto mb-3" style="width:100px;height:100px;background:linear-gradient(135deg,#EE2E24,#1A73E8);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:2.5rem;">
                <i class="fas fa-user-tie"></i>
              </div>
              <h4>Rajesh Kumar</h4>
              <p class="text-muted">Founder & CEO</p>
              <p class="small">Ex-OYO, IIT Delhi. Started this after his own bad rental experience.</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="text-center">
              <div class="mx-auto mb-3" style="width:100px;height:100px;background:linear-gradient(135deg,#1A73E8,#34A853);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:2.5rem;">
                <i class="fas fa-laptop-code"></i>
              </div>
              <h4>Priya Sharma</h4>
              <p class="text-muted">CTO</p>
              <p class="small">Built the entire platform. Believes in simple, user-friendly tech.</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="text-center">
              <div class="mx-auto mb-3" style="width:100px;height:100px;background:linear-gradient(135deg,#34A853,#EE2E24);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:2.5rem;">
                <i class="fas fa-users"></i>
              </div>
              <h4>Amit Patel</h4>
              <p class="text-muted">Head of Operations</p>
              <p class="small">Ensures every property is verified. Quality is his obsession.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <app-footer></app-footer>
  `,
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
