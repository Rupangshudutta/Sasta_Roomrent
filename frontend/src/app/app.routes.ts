import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Home
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },

  // Properties
  {
    path: 'properties',
    loadComponent: () => import('./features/properties/property-list/property-list.component').then(m => m.PropertyListComponent),
  },
  {
    path: 'properties/:id',
    loadComponent: () => import('./features/properties/property-details/property-details.component').then(m => m.PropertyDetailsComponent),
  },
  {
    path: 'properties/:id/book',
    canActivate: [authGuard],
    loadComponent: () => import('./features/bookings/booking-checkout/booking-checkout.component').then(m => m.BookingCheckoutComponent),
  },

  // Auth
  {
    path: 'auth/login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'auth/register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },

  // Dashboards
  {
    path: 'dashboard/customer',
    canActivate: [authGuard, roleGuard(['customer', 'admin'])],
    loadComponent: () => import('./features/dashboard/customer/customer-dashboard.component').then(m => m.CustomerDashboardComponent),
  },
  {
    path: 'dashboard/owner',
    canActivate: [authGuard, roleGuard(['owner', 'admin'])],
    loadComponent: () => import('./features/dashboard/owner/owner-dashboard.component').then(m => m.OwnerDashboardComponent),
  },
  {
    path: 'dashboard/admin',
    canActivate: [authGuard, roleGuard(['admin'])],
    loadComponent: () => import('./features/dashboard/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
  },

  // About & Contact (already existed)
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent),
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent),
  },

  // Support pages
  {
    path: 'help',
    loadComponent: () => import('./features/help/help.component').then(m => m.HelpComponent),
  },
  {
    path: 'terms',
    loadComponent: () => import('./features/terms/terms.component').then(m => m.TermsComponent),
  },
  {
    path: 'privacy',
    loadComponent: () => import('./features/privacy/privacy.component').then(m => m.PrivacyComponent),
  },
  {
    path: 'safety',
    loadComponent: () => import('./features/safety/safety.component').then(m => m.SafetyComponent),
  },

  // Owner pages
  {
    path: 'list-property',
    canActivate: [authGuard],
    loadComponent: () => import('./features/list-property/list-property.component').then(m => m.ListPropertyComponent),
  },
  {
    path: 'owner/guidelines',
    loadComponent: () => import('./features/owner-guidelines/owner-guidelines.component').then(m => m.OwnerGuidelinesComponent),
  },
  {
    path: 'owner/success',
    loadComponent: () => import('./features/owner-success/owner-success.component').then(m => m.OwnerSuccessComponent),
  },

  // Fallback
  { path: '**', redirectTo: '' },
];

