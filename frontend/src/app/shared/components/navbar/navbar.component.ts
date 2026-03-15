import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark sticky-top">
      <div class="container">
        <a class="navbar-brand" routerLink="/">
          <i class="fas fa-home me-2"></i>
          <strong>Sasta Room</strong>
        </a>

        <button class="navbar-toggler" type="button" (click)="toggleMenu()">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" [class.show]="menuOpen" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/properties" routerLinkActive="active">Properties</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/about" routerLinkActive="active">Locations</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/about" routerLinkActive="active">About</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/contact" routerLinkActive="active">Contact</a>
            </li>
          </ul>

          <div class="d-flex">
            @if (auth.isAuthenticated()) {
              <div class="dropdown">
                <button class="btn btn-outline-light dropdown-toggle" data-bs-toggle="dropdown">
                  <i class="fas fa-user me-1"></i>{{ auth.user()?.first_name }}
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  @if (auth.isAdmin()) {
                    <li><a class="dropdown-item" routerLink="/dashboard/admin"><i class="fas fa-chart-line me-2"></i>Admin Panel</a></li>
                  }
                  @if (auth.isOwner()) {
                    <li><a class="dropdown-item" routerLink="/dashboard/owner"><i class="fas fa-building me-2"></i>My Properties</a></li>
                  }
                  @if (auth.isCustomer()) {
                    <li><a class="dropdown-item" routerLink="/dashboard/customer"><i class="fas fa-calendar me-2"></i>My Bookings</a></li>
                  }
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item text-danger" href="#" (click)="logout($event)"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                </ul>
              </div>
            } @else {
              <a routerLink="/auth/login" class="btn btn-outline-light me-2">
                <i class="fas fa-sign-in-alt me-1"></i> Login
              </a>
              <a routerLink="/auth/register" class="btn btn-light">
                <i class="fas fa-user-plus me-1"></i> Sign Up
              </a>
            }
          </div>
        </div>
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  auth = inject(AuthService);
  menuOpen = false;

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }

  logout(e: Event): void {
    e.preventDefault();
    this.auth.logout();
  }
}
