import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styles: [`
    .login-page-wrapper {
      background: linear-gradient(135deg, #F8F9FA 0%, #e8f0fe 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      padding: 20px;
    }
    .login-container {
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.1);
      min-height: 600px;
    }
    .login-sidebar {
      background: linear-gradient(135deg, #EE2E24 0%, #d42a20 100%);
      color: white;
      padding: 60px 40px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 600px;
    }
    .brand-logo {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
    }
    .feature-list { text-align: left; margin-top: 40px; }
    .feature-item { display: flex; align-items: center; margin-bottom: 15px; opacity: 0.9; }
    .feature-item i {
      background: rgba(255,255,255,0.2);
      padding: 8px;
      border-radius: 8px;
      margin-right: 15px;
      width: 35px; height: 35px;
      display: flex; align-items: center; justify-content: center;
    }
    .login-form-container {
      padding: 60px 50px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 600px;
    }
    .form-header { text-align: center; margin-bottom: 40px; }
    .form-header h2 { color: #202124; font-weight: 700; margin-bottom: 10px; }
    .form-header p { color: #6c757d; font-size: 1.1rem; }
    .user-type-selector {
      display: flex; gap: 8px; margin-bottom: 30px;
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
    .form-group { margin-bottom: 20px; }
    .form-label { display: block; margin-bottom: 8px; font-weight: 600; color: #202124; }
    .form-control {
      width: 100%; border: 2px solid #e8eaed;
      border-radius: 10px; padding: 15px 20px;
      font-size: 16px; transition: all 0.3s; background: white;
    }
    .form-control:focus {
      outline: none; border-color: #EE2E24;
      box-shadow: 0 0 0 0.2rem rgba(238,46,36,0.25);
    }
    .form-control.input-error { border-color: #dc3545; }
    .error-message { color: #dc3545; font-size: 0.85rem; margin-top: 5px; }
    .form-options {
      display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 30px;
    }
    .form-check { display: flex; align-items: center; gap: 8px; }
    .forgot-password { color: #EE2E24; text-decoration: none; font-weight: 500; }
    .btn-submit {
      width: 100%; background: #EE2E24; color: white;
      border: none; padding: 15px 30px; border-radius: 10px;
      font-weight: 600; font-size: 1.1rem; transition: all 0.3s;
      cursor: pointer; display: flex; align-items: center;
      justify-content: center; gap: 10px;
    }
    .btn-submit:hover:not(:disabled) {
      background: #d42a20; transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(238,46,36,0.3);
    }
    .btn-submit:disabled { background: #6c757d; cursor: not-allowed; }
    .login-divider { position: relative; margin: 30px 0; }
    .login-divider hr { border: none; height: 1px; background: #e8eaed; margin: 0; }
    .divider-text {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      background: white; padding: 0 20px; color: #6c757d;
    }
    .social-login { display: flex; gap: 15px; margin-bottom: 30px; }
    .social-btn {
      flex: 1; padding: 12px; border: 2px solid #e8eaed;
      border-radius: 10px; background: white; transition: all 0.3s;
      text-decoration: none; color: #202124;
      display: flex; align-items: center; justify-content: center;
      gap: 8px; font-weight: 500;
    }
    .social-btn:hover { border-color: #EE2E24; color: #EE2E24; }
    .signup-link { text-align: center; color: #6c757d; }
    .signup-link a { color: #EE2E24; text-decoration: none; font-weight: 600; }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = false;
  error = '';
  selectedRole: 'customer' | 'owner' | 'admin' = 'customer';
  get f() { return this.form.controls; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';

    this.auth.login(this.form.value.email!, this.form.value.password!).subscribe({
      next: (res: any) => {
        if (res.success) {
          const role = this.auth.userRole();
          if (role === 'admin') this.router.navigate(['/dashboard/admin']);
          else if (role === 'owner') this.router.navigate(['/dashboard/owner']);
          else this.router.navigate(['/']);
        }
      },
      error: (err) => { this.error = err.error?.message || 'Login failed. Please check your credentials.'; this.loading = false; },
      complete: () => { this.loading = false; },
    });
  }
}
