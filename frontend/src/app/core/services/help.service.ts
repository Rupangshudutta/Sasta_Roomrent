import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';

export interface HelpArticle {
  id: number;
  category: string;
  title: string;
  content: string;
  is_popular: boolean;
  read_time: number;
  created_at: string;
  updated_at: string;
}

export interface HelpCategory {
  category: string;
  count: number;
  icon?: string; // We'll map these in the component
}

@Injectable({
  providedIn: 'root',
})
export class HelpService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/help`;
  
  private categoriesCache: HelpCategory[] | null = null;
  private articlesCache: Record<string, HelpArticle[]> = {};

  getCategories(): Observable<{ success: boolean; data: HelpCategory[] }> {
    if (this.categoriesCache) {
      return new Observable(obs => {
        obs.next({ success: true, data: this.categoriesCache! });
        obs.complete();
      });
    }
    return this.http.get<{ success: boolean; data: HelpCategory[] }>(`${this.apiUrl}/categories`).pipe(
      tap(res => { if (res.success) this.categoriesCache = res.data; })
    );
  }

  getPopularArticles(): Observable<{ success: boolean; data: HelpArticle[] }> {
    return this.http.get<{ success: boolean; data: HelpArticle[] }>(`${this.apiUrl}/articles/popular`);
  }

  getArticlesByCategory(category: string): Observable<{ success: boolean; data: HelpArticle[] }> {
    if (this.articlesCache[category]) {
      return new Observable(obs => {
        obs.next({ success: true, data: this.articlesCache[category] });
        obs.complete();
      });
    }
    return this.http.get<{ success: boolean; data: HelpArticle[] }>(`${this.apiUrl}/articles/category/${encodeURIComponent(category)}`).pipe(
      tap(res => { if (res.success) this.articlesCache[category] = res.data; })
    );
  }

  searchArticles(query: string): Observable<{ success: boolean; data: HelpArticle[] }> {
    return this.http.get<{ success: boolean; data: HelpArticle[] }>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
  }

  getArticleById(id: number): Observable<{ success: boolean; data: HelpArticle }> {
    return this.http.get<{ success: boolean; data: HelpArticle }>(`${this.apiUrl}/articles/${id}`);
  }
}
