import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): Observable<boolean> {
    return this.authService.validateToken().pipe(
      map(response => {
        if (response.authenticated) {
          return true; // El usuario está autenticado
        } else {
          this.router.navigate(['/login']); // Redirige al login si no está autenticado
          return false;
        }
      }),
      catchError(() => {
        this.router.navigate(['/login']); // Maneja errores y redirige al login
        return of(false);
      })
    );
  }
}
