import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-list-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './list-property.component.html',
  styles: [`
    .page-hero { background: linear-gradient(135deg, #EE2E24, #d42a20); color: white; padding: 60px 0; }
    .step-indicator { display: flex; justify-content: center; gap: 0; margin: 40px 0; }
    .step { display: flex; align-items: center; }
    .step-circle { width: 44px; height: 44px; border-radius: 50%; background: #e0e0e0; color: #999; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; position: relative; z-index: 1; }
    .step.active .step-circle { background: #EE2E24; color: white; box-shadow: 0 0 0 5px rgba(238,46,36,0.2); }
    .step.done .step-circle { background: #34A853; color: white; }
    .step-label { font-size: 0.8rem; color: #999; font-weight: 600; }
    .step.active .step-label { color: #EE2E24; }
    .step-line { width: 80px; height: 3px; background: #e0e0e0; margin: 0 8px; }
    .step-box { background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 25px rgba(0,0,0,0.08); }
    .form-control, .form-select, .form-check-input { border-radius: 10px; border: 1.5px solid #e0e0e0; transition: border-color 0.2s; }
    .form-control:focus, .form-select:focus { border-color: #EE2E24; box-shadow: 0 0 0 3px rgba(238,46,36,0.1); }
    .amenity-check { display: flex; align-items: center; gap: 10px; padding: 10px 15px; border: 1.5px solid #e0e0e0; border-radius: 10px; cursor: pointer; }
    .amenity-check:has(input:checked) { border-color: #EE2E24; background: #fff3f2; }
    .upload-area { border: 2.5px dashed #ccc; border-radius: 16px; padding: 50px; text-align: center; cursor: pointer; transition: all 0.3s; }
    .upload-area:hover { border-color: #EE2E24; background: #fff3f2; }
    .nav-buttons { display: flex; justify-content: space-between; margin-top: 30px; }
  `],
})
export class ListPropertyComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  currentStep = signal(1);
  totalSteps = 3;
  submitting = signal(false);
  submitted = signal(false);

  step1Form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(10)]],
    property_type: ['', Validators.required],
    address_line1: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern('^[1-9][0-9]{5}$')]],
  });

  step2Form: FormGroup = this.fb.group({
    rent_amount: ['', [Validators.required, Validators.min(500)]],
    security_deposit: ['', Validators.required],
    bedrooms: [1, Validators.required],
    bathrooms: [1, Validators.required],
    furnishing: ['', Validators.required],
    max_occupancy: [1, Validators.required],
    description: ['', [Validators.required, Validators.minLength(50)]],
  });

  amenities = ['WiFi', 'AC', 'Geyser', 'Parking', 'CCTV', 'Security Guard', 'Power Backup', 'Laundry', 'Gym', 'Lift'];
  selectedAmenities: string[] = [];

  toggleAmenity(amenity: string) {
    const idx = this.selectedAmenities.indexOf(amenity);
    if (idx === -1) this.selectedAmenities.push(amenity);
    else this.selectedAmenities.splice(idx, 1);
  }

  nextStep() {
    if (this.currentStep() === 1 && this.step1Form.valid) this.currentStep.set(2);
    else if (this.currentStep() === 2 && this.step2Form.valid) this.currentStep.set(3);
  }

  prevStep() {
    if (this.currentStep() > 1) this.currentStep.set(this.currentStep() - 1);
  }

  submitListing() {
    const payload = {
      ...this.step1Form.value,
      ...this.step2Form.value,
      amenities: this.selectedAmenities,
    };
    this.submitting.set(true);
    this.http.post(`${environment.apiUrl}/properties`, payload).subscribe({
      next: () => { this.submitted.set(true); this.submitting.set(false); },
      error: () => { this.submitting.set(false); },
    });
  }
}
