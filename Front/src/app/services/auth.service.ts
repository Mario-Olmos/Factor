import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs';
import { User } from '../models/user.model';

interface TokenValidationResponse {
  authenticated: boolean;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = new BehaviorSubject<User | null>(null);
  private apiUrl = 'http://localhost:3000/api/auth'; // URL del backend
  constructor(private http: HttpClient) { }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { withCredentials: true });
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  validateToken(): Observable<TokenValidationResponse> {
    return this.http.get<TokenValidationResponse>(`${this.apiUrl}/validate-token`, { withCredentials: true }).pipe(
      map(response => {
        if (response.authenticated && response.user) {
          this.currentUser.next(response.user);
        } else {
          this.currentUser.next(null);
        }
        return response;
      })
    );
  }

  getCurrentUser() {
    return this.currentUser.asObservable();
  }
}
