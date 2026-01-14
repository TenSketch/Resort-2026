import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TentReservationService {
  private apiUrl = `${environment.apiUrl}/tent-reservations`;

  constructor(private http: HttpClient) {}

  createReservation(reservationData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, reservationData);
  }

  getReservationByBookingId(bookingId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/booking/${bookingId}`);
  }

  getAllReservations(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}`, { params });
  }

  getReservationById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  updateReservation(id: string, updateData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, updateData);
  }

  updatePaymentStatus(id: string, paymentData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/payment`, paymentData);
  }

  cancelReservation(id: string, refundPercentage?: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/cancel`, { refundPercentage });
  }

  deleteReservation(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
