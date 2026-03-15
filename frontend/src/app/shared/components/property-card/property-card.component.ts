import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Property } from '../../models/models';

@Component({
  selector: 'app-property-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  templateUrl: './property-card.component.html',
  styles: [`
    .hover-lift {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .hover-lift:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
    }
    .property-action-btn {
      background: linear-gradient(135deg, #e3342f, #c71f1b);
      border: none;
      transition: all 0.3s ease;
    }
    .property-action-btn:hover {
      background: linear-gradient(135deg, #c71f1b, #a51a17);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(227, 52, 47, 0.3) !important;
    }
    /* Relying on global styles.scss for other tokens */
  `],
})
export class PropertyCardComponent {
  @Input({ required: true }) property!: Property;
}
