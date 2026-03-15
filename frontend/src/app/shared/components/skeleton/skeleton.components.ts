import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgFor } from '@angular/common';

/**
 * Reusable skeleton property card with shimmer animation.
 * Drop-in replacement while API data loads.
 */
@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton-card">
      <div class="skeleton-img shimmer"></div>
      <div class="skeleton-body">
        <div class="skeleton-line shimmer" style="width:60%;height:12px;"></div>
        <div class="skeleton-line shimmer" style="width:40%;height:10px;margin-top:8px;"></div>
        <div class="skeleton-line shimmer" style="width:90%;height:10px;margin-top:8px;"></div>
        <div class="skeleton-footer">
          <div class="skeleton-line shimmer" style="width:35%;height:14px;"></div>
          <div class="skeleton-line shimmer" style="width:25%;height:28px;border-radius:20px;"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .skeleton-img {
      width: 100%; height: 200px;
    }
    .skeleton-body { padding: 16px; }
    .skeleton-line {
      border-radius: 6px;
      height: 12px;
      margin-top: 6px;
    }
    .skeleton-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
    }
  `],
})
export class SkeletonCardComponent {}

/**
 * Grid of skeleton cards for list pages.
 */
@Component({
  selector: 'app-skeleton-list',
  standalone: true,
  imports: [NgFor, SkeletonCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row g-4">
      @for (i of items; track i) {
        <div [class]="colClass">
          <app-skeleton-card></app-skeleton-card>
        </div>
      }
    </div>
  `,
})
export class SkeletonListComponent {
  @Input() count = 6;
  @Input() colClass = 'col-md-6 col-lg-4';
  get items(): number[] { return Array.from({ length: this.count }, (_, i) => i); }
}

/**
 * Full-page skeleton for the property detail view (gallery + info).
 */
@Component({
  selector: 'app-skeleton-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container py-4">
      <!-- Gallery -->
      <div class="skeleton-gallery shimmer mb-4"></div>
      <div class="row g-4">
        <!-- Info -->
        <div class="col-lg-7">
          <div class="skeleton-line shimmer" style="width:70%;height:28px;"></div>
          <div class="skeleton-line shimmer" style="width:40%;height:16px;margin-top:12px;"></div>
          <div class="skeleton-line shimmer" style="width:100%;height:12px;margin-top:20px;"></div>
          <div class="skeleton-line shimmer" style="width:95%;height:12px;margin-top:8px;"></div>
          <div class="skeleton-line shimmer" style="width:85%;height:12px;margin-top:8px;"></div>
          <div class="row g-3 mt-3">
            @for (i of [1,2,3,4]; track i) {
              <div class="col-6">
                <div class="skeleton-line shimmer" style="height:40px;border-radius:12px;"></div>
              </div>
            }
          </div>
        </div>
        <!-- Price card -->
        <div class="col-lg-5">
          <div class="p-4 border rounded-4">
            <div class="skeleton-line shimmer" style="width:50%;height:32px;"></div>
            <div class="skeleton-line shimmer" style="width:80%;height:14px;margin-top:12px;"></div>
            <div class="skeleton-line shimmer" style="width:100%;height:50px;margin-top:20px;border-radius:12px;"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-gallery { width: 100%; height: 380px; border-radius: 16px; }
    .skeleton-line { border-radius: 6px; }
  `],
})
export class SkeletonDetailComponent {}
