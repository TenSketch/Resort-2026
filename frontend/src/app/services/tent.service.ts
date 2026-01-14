import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TentService {
  private apiUrl = `${environment.apiUrl}/tents`;
  
  constructor(private http: HttpClient) {}

  getAllTents(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }

  getTentsBySpot(tentSpotId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}`, {
      params: new HttpParams().set('tentSpotId', tentSpotId)
    });
  }

  getAvailableTents(tentSpotId: string, checkinDate: string, checkoutDate: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/available`, {
      params: new HttpParams()
        .set('tentSpotId', tentSpotId)
        .set('checkinDate', checkinDate)
        .set('checkoutDate', checkoutDate)
    });
  }

  getTents(resortKey: string): Observable<any> {
    // Fallback for backward compatibility
    return this.getAllTents();
  }
}
