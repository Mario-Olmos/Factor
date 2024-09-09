import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface TokenValidationResponse {
  authenticated: boolean;
  user?: any; // Puedes definir una interfaz más detallada para el usuario si lo deseas
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/profile'; // URL del backend
  constructor(private http: HttpClient) { }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { withCredentials: true });
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  validateToken(): Observable<TokenValidationResponse> {
    return this.http.get<TokenValidationResponse>(`${this.apiUrl}/validate-token`, { withCredentials: true });
  }
}
