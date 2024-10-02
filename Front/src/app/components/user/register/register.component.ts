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
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['',  [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/)]], // Mínimo 8 caracteres y 1 especial
      fechaNacimiento: ['', [Validators.required, this.ageValidator]]
    });

    console.log(this.registerForm);
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      console.log(this.registerForm);
      this.errorMessage = 'Por favor, complete correctamente todos los campos';
      return;
    }

    console.log(this.registerForm);
    this.authService.register(this.registerForm.value).subscribe(
      response => {
        this.successMessage = 'Registro exitoso';
        this.errorMessage = '';
        this.router.navigate(['/login']);
      },
      error => {
        this.errorMessage = 'Error en el registro, intenta nuevamente';
        this.successMessage = '';
      }
    );
  }

  hasError(controlName: string, errorName: string): boolean {
    return this.registerForm.get(controlName)!.hasError(errorName) && this.registerForm.get(controlName)!.touched;
  }

  // Validación fecha de nacimiento (mayor de 18 años)
  ageValidator(control: any): { [key: string]: boolean } | null {
    const inputDate = new Date(control.value);
    const currentDate = new Date();
    const age = currentDate.getFullYear() - inputDate.getFullYear();
    if (age < 18 || (age === 18 && currentDate < new Date(inputDate.setFullYear(inputDate.getFullYear() + 18)))) {
      return { 'underage': true }; // Si es menor de 18
    } 
    return null;
  }
}
