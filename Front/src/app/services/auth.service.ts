import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
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
  private apiUrl = 'http://localhost:3000/api/auth'; 

  constructor(private http: HttpClient) {}

  // Método de login
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { withCredentials: true });
  }

  // Método de registro
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // Método para validar el token y actualizar el BehaviorSubject
  validateToken(): Observable<TokenValidationResponse> {
    return this.http.get<TokenValidationResponse>(`${this.apiUrl}/validate-token`, { withCredentials: true }).pipe(
      map(response => {
        if (response.authenticated && response.user) {
          this.currentUser.next(response.user); // Usuario autenticado, actualiza el BehaviorSubject
        } else {
          this.currentUser.next(null); // Token inválido o usuario no autenticado
        }
        return response; 
      })
    );
  }

  // Método para obtener el usuario actual como observable
  getCurrentUser(): Observable<User | null> {
    return this.currentUser.asObservable();
  }

  // Método de logout
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      map(() => {
        this.currentUser.next(null); // Reinicia el BehaviorSubject
      })
    );
  }
}
