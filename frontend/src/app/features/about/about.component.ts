import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, signal, inject, PLATFORM_ID, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-about',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit, AfterViewInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  
  @ViewChildren('revealAnim') revealElements!: QueryList<ElementRef>;
  @ViewChildren('countUp') counterElements!: QueryList<ElementRef>;

  // Stats signals
  usersCount = signal(0);
  propertiesCount = signal(0);
  citiesCount = signal(0);
  satisfactionCount = signal(0);

  private observer: IntersectionObserver | null = null;
  private hasAnimatedStats = false;

  teamMembers = [
    { name: 'Rajesh Kumar', role: 'Founder & CEO', image: 'https://i.pravatar.cc/150?img=11', ln: '#' },
    { name: 'Priya Sharma', role: 'CTO', image: 'https://i.pravatar.cc/150?img=5', ln: '#' },
    { name: 'Amit Patel', role: 'Head of Operations', image: 'https://i.pravatar.cc/150?img=8', ln: '#' },
    { name: 'Sneha Reddy', role: 'Head of Design', image: 'https://i.pravatar.cc/150?img=4', ln: '#' }
  ];

  ngOnInit() {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initIntersectionObserver();
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private initIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.2
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          
          if (entry.target.classList.contains('stats-section') && !this.hasAnimatedStats) {
            this.animateStats();
            this.hasAnimatedStats = true;
          }
        }
      });
    }, options);

    this.revealElements.forEach(el => this.observer?.observe(el.nativeElement));
  }

  private animateStats() {
    this.animateValue(this.usersCount, 0, 10, 2000); // 10K+
    this.animateValue(this.propertiesCount, 0, 1500, 2000); // 1500+
    this.animateValue(this.citiesCount, 0, 20, 2000); // 20+
    this.animateValue(this.satisfactionCount, 0, 95, 2000); // 95%
  }

  private animateValue(targetSignal: any, start: number, end: number, duration: number) {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function: easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      targetSignal.set(Math.floor(easeProgress * (end - start) + start));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }
}

