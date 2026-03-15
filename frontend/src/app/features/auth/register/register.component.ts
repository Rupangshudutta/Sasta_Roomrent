import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="register-page-wrapper">
      <div class="container">
        <div class="register-container row g-0">

          <!-- Sidebar -->
          <div class="col-lg-5 register-sidebar">
            <div class="brand-logo">
              <i class="fas fa-home"></i> Sasta Room
            </div>
            <h3 class="mb-4">Join Our Community!</h3>
            <p class="lead">Create your account and start your journey</p>
            <div class="feature-list">
              <div class="feature-item">
                <i class="fas fa-rocket"></i>
                <span>Quick and easy registration</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-shield-alt"></i>
                <span>Secure and verified accounts</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-star"></i>
                <span>Access to premium features</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-headset"></i>
                <span>24/7 customer support</span>
              </div>
            </div>
          </div>

          <!-- Registration Form -->
          <div class="col-lg-7 register-form-container">
            <div class="mb-4">
              <h2 class="fw-bold mb-2">Create Account</h2>
              <p class="text-muted">Choose your account type and get started</p>
            </div>

            <!-- User Type Selector -->
            <div class="user-type-selector mb-4">
              <button type="button" class="user-type-btn" [class.active]="selectedRole === 'customer'"
                (click)="selectedRole = 'customer'">
                <i class="fas fa-user me-2"></i>Customer
              </button>
              <button type="button" class="user-type-btn" [class.active]="selectedRole === 'owner'"
                (click)="selectedRole = 'owner'">
                <i class="fas fa-building me-2"></i>Room Owner
              </button>
            </div>

            @if (error) {
              <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>{{ error }}
              </div>
            }
            @if (success) {
              <div class="alert alert-success">
                <i class="fas fa-check-circle me-2"></i>{{ success }}
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label fw-semibold">First Name</label>
                  <input type="text" class="form-control" formControlName="first_name" placeholder="Enter first name"
                    [class.input-error]="f['first_name'].touched && f['first_name'].invalid">
                  @if (f['first_name'].touched && f['first_name'].invalid) {
                    <small class="text-danger">First name is required</small>
                  }
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Last Name</label>
                  <input type="text" class="form-control" formControlName="last_name" placeholder="Enter last name"
                    [class.input-error]="f['last_name'].touched && f['last_name'].invalid">
                  @if (f['last_name'].touched && f['last_name'].invalid) {
                    <small class="text-danger">Last name is required</small>
                  }
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Email Address</label>
                <input type="email" class="form-control" formControlName="email" placeholder="Enter your email"
                  [class.input-error]="f['email'].touched && f['email'].invalid">
                @if (f['email'].touched && f['email'].invalid) {
                  <small class="text-danger">Please enter a valid email</small>
                }
              </div>

              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Phone Number</label>
                  <input type="tel" class="form-control" formControlName="phone"
                    placeholder="10-digit mobile number" maxlength="10"
                    [class.input-error]="f['phone'].touched && f['phone'].invalid"
                    [class.input-valid]="f['phone'].touched && f['phone'].valid && f['phone'].value"
                    (input)="onPhoneInput($event)">
                  @if (f['phone'].touched && f['phone'].invalid && f['phone'].value) {
                    <small class="text-danger"><i class="fas fa-exclamation-circle me-1"></i>Please enter a valid 10-digit mobile number</small>
                  }
                  @if (f['phone'].touched && f['phone'].valid && f['phone'].value) {
                    <small class="text-success"><i class="fas fa-check-circle me-1"></i>Valid mobile number</small>
                  }
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Date of Birth</label>
                  <input type="date" class="form-control" formControlName="dob">
                </div>
              </div>

              <!-- Owner-Specific Fields -->
              @if (selectedRole === 'owner') {
                <div class="mb-3">
                  <label class="form-label fw-semibold">Business Name <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" formControlName="business_name" placeholder="Enter business/property name">
                </div>
                <div class="row mb-3">
                  <div class="col-md-6">
                    <label class="form-label fw-semibold">Business Type <span class="text-danger">*</span></label>
                    <select class="form-select" formControlName="business_type">
                      <option value="">Select business type</option>
                      <option value="individual">Individual Owner</option>
                      <option value="company">Company</option>
                      <option value="agency">Real Estate Agency</option>
                      <option value="broker">Property Broker</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-semibold">Experience (Years)</label>
                    <select class="form-select" formControlName="experience">
                      <option value="">Select experience</option>
                      <option value="0-1">0-1 Years</option>
                      <option value="1-3">1-3 Years</option>
                      <option value="3-5">3-5 Years</option>
                      <option value="5+">5+ Years</option>
                    </select>
                  </div>
                </div>
              }

              <div class="mb-3">
                <label class="form-label fw-semibold">Address</label>
                <input type="text" class="form-control" formControlName="address" placeholder="Enter your address">
              </div>

              <div class="row mb-3">
                <div class="col-md-4">
                  <label class="form-label fw-semibold">City</label>
                  <input type="text" class="form-control" formControlName="city" placeholder="Enter city">
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">State</label>
                  <select class="form-select" formControlName="state">
                    <option value="">Select state</option>
                    <option>Andhra Pradesh</option>
                    <option>Karnataka</option>
                    <option>Tamil Nadu</option>
                    <option>Maharashtra</option>
                    <option>Delhi</option>
                    <option>Gujarat</option>
                    <option>Rajasthan</option>
                    <option>West Bengal</option>
                    <option>Uttar Pradesh</option>
                    <option>Other</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">Pincode</label>
                  <input type="text" class="form-control" formControlName="pincode" placeholder="6-digit pincode" maxlength="6">
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Password</label>
                <input type="password" class="form-control" formControlName="password" placeholder="Create a strong password"
                  [class.input-error]="f['password'].touched && f['password'].invalid"
                  (input)="checkPasswordStrength($any($event.target).value)">
                <div class="password-strength">
                  <div class="strength-bar">
                    <div class="strength-fill" [class]="strengthClass"></div>
                  </div>
                  <small [class]="strengthTextClass">{{ strengthText }}</small>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Confirm Password</label>
                <input type="password" class="form-control" formControlName="confirm_password" placeholder="Confirm your password">
                @if (f['confirm_password'].value && f['password'].value !== f['confirm_password'].value) {
                  <small class="text-danger">Passwords do not match</small>
                }
                @if (f['confirm_password'].value && f['password'].value === f['confirm_password'].value && f['confirm_password'].value.length > 0) {
                  <small class="text-success">Passwords match</small>
                }
              </div>

              <div class="mb-4">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="agreeTerms" formControlName="agreeTerms">
                  <label class="form-check-label terms-text" for="agreeTerms">
                    I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                  </label>
                </div>
                <div class="form-check mt-2">
                  <input class="form-check-input" type="checkbox" id="newsletter">
                  <label class="form-check-label terms-text" for="newsletter">
                    Subscribe to our newsletter for updates and offers
                  </label>
                </div>
              </div>

              <button type="submit" class="btn btn-primary w-100 mb-4" [disabled]="loading">
                @if (loading) { <span class="spinner-border spinner-border-sm me-2"></span> }
                Create Account <i class="fas fa-arrow-right ms-2"></i>
              </button>
            </form>

            <!-- Divider -->
            <div class="position-relative mb-4">
              <hr>
              <span class="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted">or</span>
            </div>

            <!-- Social Registration -->
            <div class="social-login mb-4">
              <a href="#" class="social-btn"><i class="fab fa-google"></i> Google</a>
              <a href="#" class="social-btn"><i class="fab fa-facebook-f"></i> Facebook</a>
            </div>

            <!-- Sign In Link -->
            <div class="text-center">
              <p class="mb-0">Already have an account?
                <a routerLink="/auth/login" class="text-decoration-none fw-semibold" style="color:#EE2E24">Sign In</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-page-wrapper {
      background: linear-gradient(135deg, #F8F9FA 0%, #e8f0fe 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      padding: 20px 0;
    }
    .register-container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.1);
    }
    .register-sidebar {
      background: linear-gradient(135deg, #EE2E24 0%, #d42a20 100%);
      color: white;
      padding: 60px 40px;
      text-align: center;
    }
    .brand-logo {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 20px;
    }
    .feature-list { text-align: left; margin-top: 40px; }
    .feature-item { display: flex; align-items: center; margin-bottom: 15px; opacity: 0.9; }
    .feature-item i {
      background: rgba(255,255,255,0.2);
      padding: 8px; border-radius: 8px; margin-right: 15px;
      width: 35px; height: 35px;
      display: flex; align-items: center; justify-content: center;
    }
    .user-type-selector {
      display: flex; gap: 10px;
      background: rgba(238,46,36,0.1);
      border-radius: 15px; padding: 5px;
    }
    .user-type-btn {
      flex: 1; padding: 12px 8px; border: none;
      background: transparent; color: #EE2E24;
      border-radius: 12px; transition: all 0.3s;
      font-weight: 500; font-size: 0.9rem; cursor: pointer;
    }
    .user-type-btn.active {
      background: #EE2E24; color: white;
      box-shadow: 0 3px 10px rgba(238,46,36,0.3);
    }
    .register-form-container { padding: 60px 50px; }
    .form-control, .form-select {
      border: 2px solid #e8eaed; border-radius: 10px;
      padding: 12px 18px; font-size: 15px; transition: all 0.3s;
    }
    .form-control:focus, .form-select:focus {
      border-color: #EE2E24;
      box-shadow: 0 0 0 0.2rem rgba(238,46,36,0.25);
    }
    .form-control.input-error { border-color: #dc3545; }
    .form-control.input-valid { border-color: #34A853; box-shadow: 0 0 0 0.2rem rgba(52,168,83,0.15); }
    .btn-primary {
      background: #EE2E24; border: none; padding: 15px 30px;
      border-radius: 10px; font-weight: 600; font-size: 1rem;
      transition: all 0.3s; cursor: pointer;
    }
    .btn-primary:hover:not(:disabled) {
      background: #d42a20; transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(238,46,36,0.3);
    }
    .btn-primary:disabled { background: #6c757d; }
    .social-login { display: flex; gap: 15px; }
    .social-btn {
      flex: 1; padding: 12px; border: 2px solid #e8eaed;
      border-radius: 10px; background: white; transition: all 0.3s;
      text-decoration: none; color: #202124;
      display: flex; align-items: center; justify-content: center;
      gap: 8px; font-weight: 500;
    }
    .social-btn:hover { border-color: #EE2E24; color: #EE2E24; }
    .terms-text { font-size: 0.875rem; color: #5f6368; }
    .terms-text a { color: #EE2E24; text-decoration: none; }
    .password-strength { margin-top: 5px; }
    .strength-bar { height: 4px; border-radius: 2px; background: #e8eaed; margin-top: 5px; overflow: hidden; }
    .strength-fill { height: 100%; transition: all 0.3s; border-radius: 2px; }
    .strength-weak { background: #ea4335; width: 25%; }
    .strength-fair { background: #fbbc04; width: 50%; }
    .strength-good { background: #34a853; width: 75%; }
    .strength-strong { background: #137333; width: 100%; }
    @media (max-width: 768px) {
      .register-sidebar { padding: 30px 20px; }
      .register-form-container { padding: 30px 20px; }
    }
  `],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  selectedRole: 'customer' | 'owner' = 'customer';
  loading = false;
  error = '';
  success = '';
  strengthClass = '';
  strengthText = '';
  strengthTextClass = 'text-muted';

  form = this.fb.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^[6-9]\d{9}$/)]],
    dob: [''],
    address: [''],
    city: [''],
    state: [''],
    pincode: [''],
    business_name: [''],
    business_type: [''],
    experience: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm_password: [''],
    agreeTerms: [false],
  });

  get f() { return this.form.controls; }

  checkPasswordStrength(password: string) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.match(/[a-z]/)) score++;
    if (password.match(/[A-Z]/)) score++;
    if (password.match(/[0-9]/)) score++;
    if (password.match(/[^a-zA-Z0-9]/)) score++;

    if (score <= 1) { this.strengthClass = 'strength-fill strength-weak'; this.strengthText = 'Password strength: Weak'; this.strengthTextClass = 'text-danger'; }
    else if (score === 2) { this.strengthClass = 'strength-fill strength-fair'; this.strengthText = 'Password strength: Fair'; this.strengthTextClass = 'text-warning'; }
    else if (score <= 4) { this.strengthClass = 'strength-fill strength-good'; this.strengthText = 'Password strength: Good'; this.strengthTextClass = 'text-info'; }
    else { this.strengthClass = 'strength-fill strength-strong'; this.strengthText = 'Password strength: Strong'; this.strengthTextClass = 'text-success'; }
  }

  onPhoneInput(event: Event): void {
    // Strip non-numeric characters and cap at 10 digits
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = digits;
    this.form.patchValue({ phone: digits });
    this.f['phone'].markAsTouched();
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.f['password'].value !== this.f['confirm_password'].value) {
      this.error = 'Passwords do not match!';
      return;
    }
    this.loading = true;
    this.error = '';

    const payload = {
      first_name: this.f['first_name'].value!,
      last_name: this.f['last_name'].value!,
      email: this.f['email'].value!,
      phone: this.f['phone'].value || '',
      password: this.f['password'].value!,
      role: this.selectedRole === 'owner' ? 'room_owner' : 'customer',
    };

    this.auth.register(payload).subscribe({
      next: (res: any) => {
        if (res.success) {
          if (this.auth.isOwner()) this.router.navigate(['/dashboard/owner']);
          else this.router.navigate(['/']);
        }
      },
      error: (err) => { this.error = err.error?.message || 'Registration failed. Please try again.'; this.loading = false; },
      complete: () => { this.loading = false; },
    });
  }
}
