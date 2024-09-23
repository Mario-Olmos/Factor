// theme.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ArticlesService } from '../../services/articles.service';

@Component({
  selector: 'app-theme',
  templateUrl: './theme.component.html',
  styleUrls: ['./theme.component.css']
})
export class ThemeComponent implements OnInit {
  themeForm!: FormGroup;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private articlesService: ArticlesService) {
  }

  ngOnInit(): void {
    // Inicializa el formulario
    this.themeForm = this.fb.group({
      name: ['', Validators.required], 
      parentTheme: ['']
    });
  }

  onSubmit(): void {
    if (this.themeForm.valid) {
      const formValue = this.themeForm.value; 
      this.articlesService.uploadTheme(formValue).subscribe(
        response => {
          this.successMessage = 'Tema/Subtema creado con éxito';
          this.themeForm.reset();
        },
        error => {
          this.errorMessage = 'Error al crear el tema/subtema';
          console.error('Error:', error);
        }
      );
    }
  }
}
