import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { PropertyService } from '../../core/services/property.service';
import { compressImage } from '../../core/utils/image-compress';

@Component({
  selector: 'app-list-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './list-property.component.html',
  styles: [`
    .page-hero { background: linear-gradient(135deg, #EE2E24, #d42a20); color: white; padding: 60px 0; }
    .step-indicator { display: flex; align-items: center; justify-content: center; margin: 40px auto; max-width: 600px; padding: 0 20px; }
    .step { display: flex; flex-direction: column; align-items: center; position: relative; z-index: 2; background: transparent; }
    .step-circle { width: 44px; height: 44px; border-radius: 50%; background: #f8f9fa; color: #adb5bd; border: 2px solid #dee2e6; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; margin-bottom: 8px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .step.active .step-circle { background: #EE2E24; color: white; border-color: #EE2E24; box-shadow: 0 0 0 5px rgba(238,46,36,0.15); transform: scale(1.1); }
    .step.done .step-circle { background: #34A853; color: white; border-color: #34A853; }
    .step-label { font-size: 0.75rem; color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; transition: color 0.3s; }
    .step.active .step-label { color: #EE2E24; }
    .step.done .step-label { color: #34A853; }
    .step-line { flex: 1; height: 3px; background: #dee2e6; margin: 0 -2px; transform: translateY(-14px); transition: background 0.3s; }
    .step-line.done { background: #34A853; }
    .step-box { background: white; border-radius: 24px; padding: 40px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 10px 40px rgba(0,0,0,0.06); }
    .form-control, .form-select, .form-check-input { border-radius: 12px; border: 1.5px solid #e9ecef; padding: 12px 16px; font-size: 0.95rem; transition: all 0.2s; }
    .form-control:focus, .form-select:focus { border-color: #EE2E24; box-shadow: 0 0 0 4px rgba(238,46,36,0.08); background-color: #fff; }
    .amenity-check { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border: 1.5px solid #e9ecef; border-radius: 14px; cursor: pointer; transition: all 0.2s; }
    .amenity-check:hover { background: #f8f9fa; border-color: #dee2e6; }
    .amenity-check:has(input:checked) { border-color: #EE2E24; background: #fff5f5; }
    .upload-area { border: 2px dashed #dee2e6; border-radius: 20px; padding: 60px 40px; text-align: center; cursor: pointer; transition: all 0.3s; background: #f8f9fa; }
    .upload-area:hover { border-color: #EE2E24; background: #fff5f5; }
    .nav-buttons { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 30px; border-top: 1px solid #f1f3f5; }
  `],
})
export class ListPropertyComponent {
  private fb = inject(FormBuilder);
  private propertyService = inject(PropertyService);
  private sanitizer = inject(DomSanitizer);

  currentStep = signal(1);
  totalSteps = 3;
  submitting = signal(false);
  submitted = signal(false);
  error = signal('');
  progress = signal('');          // e.g. "Uploading photo 2 of 5"
  processingPhotos = signal(false); // true while photos are being compressed
  createdPropertyId = signal<number | null>(null);

  step1Form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(10)]],
    description: ['', Validators.required],
    property_type: ['', Validators.required],
    address_line1: ['', Validators.required],
    address_line2: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern('^[1-9][0-9]{5}$')]],
    latitude: [''],
    longitude: [''],
    bedrooms: [1, [Validators.min(1), Validators.max(10)]],
    bathrooms: [1, [Validators.min(1), Validators.max(10)]],
    furnishing: ['unfurnished'],
    available_from: ['', Validators.required],
    min_lease_months: [1, [Validators.min(1), Validators.max(24)]],
    max_occupancy: [1, [Validators.min(1), Validators.max(10)]],
    rent_amount: ['', [Validators.required, Validators.min(500)]],
    security_deposit: [0, [Validators.min(0)]],
  });

  // Keep a minimal second step group for compatibility, but unused in the simple form.
  step2Form: FormGroup = this.fb.group({});

  amenities = ['WiFi', 'AC', 'Geyser', 'Parking', 'CCTV', 'Security Guard', 'Power Backup', 'Laundry', 'Gym', 'Lift', 'Kitchen', 'Refrigerator', 'TV', 'Washing Machine', 'RO Water', 'Gas Connection', 'Balcony', 'Garden', 'Kids Play Area', 'Community Hall'];
  selectedAmenities: string[] = [];
  uploadedImages: File[] = [];
  primaryImageIndex: number = 0;

  toggleAmenity(amenity: string) {
    const idx = this.selectedAmenities.indexOf(amenity);
    if (idx === -1) this.selectedAmenities.push(amenity);
    else this.selectedAmenities.splice(idx, 1);
  }

  async onImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = ''; // allow re-selecting the same files later
    this.error.set('');
    this.processingPhotos.set(true);
    try {
      for (const file of files) {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
          this.error.set('Only JPEG, PNG and WebP photos are allowed.');
          continue;
        }
        if (file.size > 20 * 1024 * 1024) {
          this.error.set('Each photo must be under 20 MB.');
          continue;
        }
        if (this.uploadedImages.length >= 10) {
          this.error.set('You can add up to 10 photos.');
          break;
        }
        // Shrink in the browser so uploads are fast and always under the
        // server limit, even straight from a phone camera.
        this.uploadedImages.push(await compressImage(file));
      }
    } finally {
      this.processingPhotos.set(false);
    }
  }

  removeImage(index: number) {
    this.uploadedImages.splice(index, 1);
    if (this.primaryImageIndex >= this.uploadedImages.length) {
      this.primaryImageIndex = 0;
    }
  }

  setPrimaryImage(index: number) {
    this.primaryImageIndex = index;
  }

  sanitizeImageUrl(file: File): SafeUrl {
    const url = (window.URL || window.webkitURL).createObjectURL(file);
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  nextStep() {
    if (this.currentStep() === 1 && this.step1Form.valid) this.currentStep.set(2);
    else if (this.currentStep() === 2 && this.step2Form.valid) this.currentStep.set(3);
  }

  prevStep() {
    if (this.currentStep() > 1) this.currentStep.set(this.currentStep() - 1);
  }

  // Add form validation feedback
  getErrorMessage(field: string): string {
    const control = this.step1Form.get(field);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      if (control.errors['minlength']) return `${field.charAt(0).toUpperCase() + field.slice(1)} must be at least ${control.errors['minlength'].requiredLength} characters`;
      if (control.errors['pattern']) return 'Invalid format';
      if (control.errors['min']) return `Minimum value is ${control.errors['min'].min}`;
      if (control.errors['max']) return `Maximum value is ${control.errors['max'].max}`;
    }
    return '';
  }

  /**
   * Two-phase submit:
   *   1. POST the listing as JSON → get its id
   *   2. upload photos one request at a time (primary first)
   * Keeping photos out of the first request means the listing is never lost
   * because one large upload timed out; a failed photo can be retried later.
   */
  async submitListing() {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set('');
    this.progress.set('Saving listing…');

    const values = this.step1Form.value as Record<string, unknown>;
    const payload: Record<string, unknown> = { amenities: this.selectedAmenities };
    for (const [key, val] of Object.entries(values)) {
      if (val !== '' && val !== null && val !== undefined) payload[key] = val; // drop blank optionals
    }

    let propertyId: number;
    try {
      const res = await firstValueFrom(this.propertyService.createProperty(payload));
      if (!res.success || !res.data) throw new Error(res.message || 'Could not save the listing');
      propertyId = res.data.property.id;
      this.createdPropertyId.set(propertyId);
    } catch (err: any) {
      const details = err?.error?.errors?.map((e: { field: string; message: string }) => `${e.field}: ${e.message}`).join(', ');
      this.error.set(details || err?.error?.message || err?.message || 'Could not save the listing. Please try again.');
      this.submitting.set(false);
      this.progress.set('');
      return;
    }

    // Primary photo goes first so it becomes the cover image.
    const ordered = [
      ...this.uploadedImages.filter((_, i) => i === this.primaryImageIndex),
      ...this.uploadedImages.filter((_, i) => i !== this.primaryImageIndex),
    ];
    let failed = 0;
    for (let i = 0; i < ordered.length; i++) {
      this.progress.set(`Uploading photo ${i + 1} of ${ordered.length}…`);
      try {
        await firstValueFrom(this.propertyService.uploadImage(propertyId, ordered[i], i === 0));
      } catch {
        failed++;
      }
    }

    this.submitting.set(false);
    this.progress.set('');
    this.submitted.set(true);
    if (failed > 0) {
      this.error.set(`${failed} photo(s) could not be uploaded. Your listing was saved; you can add photos later from your dashboard.`);
    }
  }
}
