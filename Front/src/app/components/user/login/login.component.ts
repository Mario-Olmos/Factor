import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  popupMessage: string = '';
  popupType: 'success' | 'error' | '' = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/)]]
    });
  }

  /**
   * Metodo para iniciar sesión.
   */
  public onLogin(): void {
    if (this.loginForm.invalid) {
      this.showErrorMessage('Por favor, complete correctamente todos los campos');
      return;
    }

    this.authService.login(this.loginForm.value).subscribe(
      () => {
        this.showSuccessMessage('Inicio de sesión exitoso');
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);
      },
      () => {
        this.showErrorMessage('Error en el inicio de sesión, verifica tus credenciales');
      }
    );
  }

  /**
   * Mensajes
   */
  private showSuccessMessage(message: string): void {
    this.popupMessage = message;
    this.popupType = 'success';
  }

  private showErrorMessage(message: string): void {
    this.popupMessage = message;
    this.popupType = 'error';
  }

  public onPopUpClosed(): void {
    this.popupMessage = '';
    this.popupType = '';
  }
}
