import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
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
