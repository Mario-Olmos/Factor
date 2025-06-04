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
  popupMessage: string = '';
  popupType: 'success' | 'error' | '' = '';

  constructor(private fb: FormBuilder, private articlesService: ArticlesService) {
  }

  ngOnInit(): void {
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
          this.showSuccessMessage('Tema/Subtema creado con éxito');
          this.themeForm.reset();
        },
        error => {
          this.showErrorMessage('Error al crear el tema/subtema');
        }
      );
    }
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
