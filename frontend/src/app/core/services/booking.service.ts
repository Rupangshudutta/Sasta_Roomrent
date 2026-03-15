import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Booking, ApiResponse } from '../../shared/models/models';

export interface CreateBookingDto {
  property_id: number;
  check_in_date: string;
  lease_months: number;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private base = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  getBookings(): Observable<ApiResponse<{ bookings: Booking[] }>> {
    return this.http.get<ApiResponse<{ bookings: Booking[] }>>(this.base);
  }

  getBookingById(id: number): Observable<ApiResponse<{ booking: Booking }>> {
    return this.http.get<ApiResponse<{ booking: Booking }>>(`${this.base}/${id}`);
  }

  createBooking(dto: CreateBookingDto): Observable<ApiResponse<{ booking: Booking }>> {
    return this.http.post<ApiResponse<{ booking: Booking }>>(this.base, dto);
  }

  updateBooking(id: number, data: Partial<Booking>): Observable<ApiResponse<{ booking: Booking }>> {
    return this.http.put<ApiResponse<{ booking: Booking }>>(`${this.base}/${id}`, data);
  }

  cancelBooking(id: number, reason?: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.base}/${id}`, { body: { reason } });
  }
}
