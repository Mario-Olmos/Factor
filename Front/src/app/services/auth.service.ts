import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserProfile } from '../models/user.model';

interface TokenValidationResponse {
  authenticated: boolean;
  user?: UserProfile;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = new BehaviorSubject<UserProfile | null>(null);
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // Método de login
  login(credentials: any): Observable<{ token: string; user: UserProfile }> {
    return this.http.post<{ token: string; user: UserProfile }>(`${this.apiUrl}/auth/login`, credentials, { withCredentials: true });
  }

  // Método de registro
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData);
  }

  // Método para validar el token y actualizar el BehaviorSubject
  validateToken(): Observable<TokenValidationResponse> {
    return this.http.get<TokenValidationResponse>(`${this.apiUrl}/auth/validate-token`, { withCredentials: true }).pipe(
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

  // Método para obtener el usuario actual como observable
  getCurrentUser() {
    return this.currentUser.asObservable();
  }

  // Método de logout
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).pipe(
      map(() => {
        this.currentUser.next(null); // Reinicia el BehaviorSubject
      })
    );
  }

  //Método para obtener los datos de un usuario
  getUserById(username: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile/getUser/${username}`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile/update`, data, { withCredentials: true }).pipe(
      map(response => {
        if (response.user) {
          this.currentUser.next(response.user);
        }
        return response;
      })
    );
  }

  /**
   * Elimina la cuenta del usuario.
   * @param deleteArticles Indica si se deben eliminar los artículos.
   * @returns Observable de la respuesta.
   */
  public deleteAccount(deleteArticles: boolean): Observable<any> {
    return this.http.delete(`${this.apiUrl}/profile/delete`, {
      params: { deleteArticles: deleteArticles.toString() },
      withCredentials: true
    });
  }

  /**
   * Obtiene privilegios del usuario.
   */
  getPrivileges(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile/privileges`, { withCredentials: true });
  }
}
