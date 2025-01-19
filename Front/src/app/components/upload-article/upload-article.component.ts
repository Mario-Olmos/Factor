import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ArticlesService } from '../../services/articles.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { Theme } from '../../models/theme.model';

@Component({
  selector: 'app-upload-article',
  templateUrl: './upload-article.component.html',
  styleUrls: ['./upload-article.component.css'] 
})
export class UploadArticleComponent implements OnInit {
  public articleForm!: FormGroup;
  public pdfFile: File | null = null;
  public pdfFileName: string | null = null;
  public pdfError: boolean = false;
  public currentUser: User | null = null;
  public themes: Theme[] = [];
  public popupMessage: string = '';
  public popupType: 'success' | 'error' | '' = '';
  public selectedFile: File | null = null; // Para la imagen seleccionada
  
  private BACKEND_URL = 'http://localhost:3000/';

  constructor(
    private fb: FormBuilder, 
    private articlesService: ArticlesService, 
    private authService: AuthService
  ) { }

  public ngOnInit(): void {
    this.articleForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      theme: ['', Validators.required],
      source: ['', Validators.required]
    });

    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });

    // Obtener las temáticas disponibles
    this.articlesService.getThemes().subscribe(
      (themes: Theme[]) => {
        this.themes = themes;
        console.log(this.themes);
      },
      (error) => {
        this.showErrorMessage('Error al cargar las temáticas.');
      }
    );
  }

  /**
   * Maneja el cambio de archivo PDF seleccionado por el usuario.
   * @param event Evento de cambio de archivo.
   */
  public onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.pdfFile = file;
      this.pdfFileName = file.name;
      this.pdfError = false;
    } else {
      this.pdfFile = null;
      this.pdfFileName = null;
      this.pdfError = true;
      this.showErrorMessage('Por favor, selecciona un archivo PDF válido.');
    }
  }

  /**
   * Verifica si el usuario tiene suficiente reputación para publicar un artículo.
   * @returns `true` si la reputación es 15 o superior, de lo contrario `false`.
   */
  public puedePublicar(): boolean {
    return this.currentUser ? this.currentUser.reputacion >= 15 : false;
  }

  /**
   * Maneja el envío del formulario de publicación de artículo.
   * Envía los datos al servicio correspondiente y maneja la respuesta.
   * @returns void
   */
  public onSubmit(): void {
    if (this.currentUser && this.articleForm.valid) {
      if (!this.puedePublicar()) {
        this.showErrorMessage('No tienes suficiente reputación para publicar.');
        return;
      }

      const formData = new FormData();
      formData.append('title', this.articleForm.get('title')?.value);
      formData.append('description', this.articleForm.get('description')?.value);
      formData.append('theme', this.articleForm.get('theme')?.value);
      formData.append('source', this.articleForm.get('source')?.value);
      if (this.pdfFile) {
        formData.append('pdf', this.pdfFile);
      }
      if (this.selectedFile) {
        formData.append('imagenPerfil', this.selectedFile);
      }
      formData.append('author', this.currentUser.userId);

      this.articlesService.uploadArticle(formData).subscribe(
        response => {
          console.log('Artículo subido con éxito', response);
          this.showSuccessMessage('Artículo subido con éxito.');
          setTimeout(() => {
            window.location.reload(); 
          }, 2000);
        },
        error => {
          console.error('Error al subir el artículo', error);
          this.showErrorMessage('Error al subir el artículo.');
        }
      );
    } else {
      console.error('Formulario inválido');
      this.showErrorMessage('Formulario inválido.');
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
