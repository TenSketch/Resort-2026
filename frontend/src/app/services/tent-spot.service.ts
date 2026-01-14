import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TentSpotService {
  private apiUrl = `${environment.apiUrl}/tent-spots`;

  constructor(private http: HttpClient) {}

  getAllTentSpots(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }

  getTentSpotById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  getTentSpotBySlug(slug: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/slug/${slug}`);
  }
}
