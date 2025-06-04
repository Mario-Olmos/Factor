import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  popupMessage: string = '';
  popupType: 'success' | 'error' | '' = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Método para inicializar el formulario.
   */
  private initializeForm(): void {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/)]], // Mínimo 8 caracteres y 1 especial
      fechaNacimiento: ['', [Validators.required, this.ageValidator]]
    });

    console.log(this.registerForm);
  }

  /**
   * Método para registrarse.
   */
  public onRegister(): void {
    if (this.registerForm.invalid) {
      this.showErrorMessage('Por favor, complete correctamente todos los campos');
      return;
    }

    this.authService.register(this.registerForm.value).subscribe(
      () => {
        this.showSuccessMessage('Registro exitoso');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      () => {
        this.showErrorMessage('Error en el registro, intentelo de nuevo más tarde');
      }
    );
  }

  /**
   * Método para registrarse.
   * @param controlName Nombre el elemento del formulario.
   * @param errorName Tipo de error en el formulario.
   */
  public hasError(controlName: string, errorName: string): boolean {
    return this.registerForm.get(controlName)!.hasError(errorName) && this.registerForm.get(controlName)!.touched;
  }

  /**
   * Método para registrarse.
   * @param control Fecha de nacimiento introducida.
   */
  private ageValidator(control: any): { [key: string]: boolean } | null {
    const inputDate = new Date(control.value);
    const currentDate = new Date();
    const age = currentDate.getFullYear() - inputDate.getFullYear();
    if (age < 18 || (age === 18 && currentDate < new Date(inputDate.setFullYear(inputDate.getFullYear() + 18)))) {
      return { 'underage': true }; 
    }
    return null;
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
