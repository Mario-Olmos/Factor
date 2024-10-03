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
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/)]]
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.showErrorMessage('Por favor, complete correctamente todos los campos');
      return;
    }

    this.authService.login(this.loginForm.value).subscribe(
      () => {
        this.showSuccessMessage('Inicio de sesión exitoso');

        // Mostrar el mensaje por 3 segundos y luego redirigir
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);
      },
      () => {
        this.showErrorMessage('Error en el inicio de sesión, verifica tus credenciales');
      }
    );
  }

  // Muestra el mensaje de éxito temporalmente
  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.clearMessagesAfterDelay();
  }

  // Muestra el mensaje de error temporalmente
  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.clearMessagesAfterDelay();
  }

  // Limpia los mensajes de éxito y error después de un tiempo
  private clearMessagesAfterDelay(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 2000); 
  }
}
