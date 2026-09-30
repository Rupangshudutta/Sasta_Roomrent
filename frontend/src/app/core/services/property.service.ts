import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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

export type PropertyStatus = 'active' | 'inactive' | 'pending';

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
    return this.http.get<ApiResponse<{ properties: Property[]; total: number }>>(this.base, { params });
  }

  getPropertyById(id: number): Observable<ApiResponse<{ property: Property }>> {
    return this.http.get<ApiResponse<{ property: Property }>>(`${this.base}/${id}`);
  }

  /** Owner: every listing they own, including pending / inactive ones. */
  getMyProperties(): Observable<ApiResponse<{ properties: Property[] }>> {
    return this.http.get<ApiResponse<{ properties: Property[] }>>(`${this.base}/my`);
  }

  /** Admin: listings awaiting approval. */
  getPending(): Observable<ApiResponse<{ properties: Property[] }>> {
    return this.http.get<ApiResponse<{ properties: Property[] }>>(`${this.base}/pending`);
  }

  /** Admin: approve (active) or reject (inactive) a listing. */
  setStatus(id: number, status: PropertyStatus): Observable<ApiResponse<{ property: Property }>> {
    return this.http.patch<ApiResponse<{ property: Property }>>(`${this.base}/${id}/status`, { status });
  }

  getFavorites(): Observable<ApiResponse<{ properties: Property[] }>> {
    return this.http.get<ApiResponse<{ properties: Property[] }>>(`${this.base}/favorites`);
  }

  /** Creates the listing record (JSON). Photos are uploaded afterwards with uploadImage(). */
  createProperty(data: Record<string, unknown>): Observable<ApiResponse<{ property: Property }>> {
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

  /** Uploads one photo. One request per photo keeps every request small. */
  uploadImage(propertyId: number, file: File, isPrimary = false): Observable<ApiResponse<{ images: { id: number; url: string }[] }>> {
    const form = new FormData();
    form.append('images', file, file.name);
    form.append('is_primary', isPrimary ? '1' : '0');
    return this.http.post<ApiResponse<{ images: { id: number; url: string }[] }>>(`${this.base}/${propertyId}/images`, form);
  }
}
