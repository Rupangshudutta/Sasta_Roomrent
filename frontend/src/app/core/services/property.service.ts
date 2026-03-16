import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Property, ApiResponse } from '../../shared/models/models';

export interface PropertyFilters {
  city?: string;
  property_type?: string;
  min_rent?: number;
  max_rent?: number;
  furnishing?: string;
  bedrooms?: number;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class PropertyService {
  private base = `${environment.apiUrl}/properties`;

  constructor(private http: HttpClient) {}

  getProperties(filters: PropertyFilters = {}): Observable<ApiResponse<{ properties: Property[]; total: number }>> {
    let params = new HttpParams();
    for (const [key, val] of Object.entries(filters)) {
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, String(val));
      }
    }
    
    console.log('[Frontend] 📡 Fetching properties with filters:', filters);
    console.log('[Frontend] 🔗 API URL:', `${this.base}?${params.toString()}`);
    
    return this.http.get<ApiResponse<{ properties: Property[]; total: number }>>(this.base, { params })
      .pipe(
        tap((response: ApiResponse<{ properties: Property[]; total: number }>) => {
          console.log('[Frontend] ✅ Properties fetched successfully:', response.data?.properties?.length || 0);
        }),
        catchError((error: any) => {
          console.error('[Frontend] ❌ Error fetching properties:', error);
          console.error('[Frontend] 📊 Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url
          });
          throw error;
        })
      );
  }

  getPropertyById(id: number): Observable<ApiResponse<{ property: Property }>> {
    return this.http.get<ApiResponse<{ property: Property }>>(`${this.base}/${id}`);
  }

  getMyProperties(): Observable<ApiResponse<{ properties: Property[] }>> {
    return this.http.get<ApiResponse<{ properties: Property[] }>>(`${this.base}/my`);
  }

  getFavorites(): Observable<ApiResponse<{ properties: Property[] }>> {
    return this.http.get<ApiResponse<{ properties: Property[] }>>(`${this.base}/favorites`);
  }

  createProperty(data: Partial<Property>): Observable<ApiResponse<{ property: Property }>> {
    return this.http.post<ApiResponse<{ property: Property }>>(this.base, data);
  }

  updateProperty(id: number, data: Partial<Property>): Observable<ApiResponse<{ property: Property }>> {
    return this.http.put<ApiResponse<{ property: Property }>>(`${this.base}/${id}`, data);
  }

  deleteProperty(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.base}/${id}`);
  }

  toggleFavorite(id: number): Observable<ApiResponse<{ added: boolean }>> {
    return this.http.post<ApiResponse<{ added: boolean }>>(`${this.base}/${id}/toggle-favorite`, {});
  }

  uploadImages(propertyId: number, files: File[]): Observable<ApiResponse> {
    const form = new FormData();
    files.forEach((f) => form.append('images', f));
    return this.http.post<ApiResponse>(`${this.base}/${propertyId}/images`, form);
  }
}
