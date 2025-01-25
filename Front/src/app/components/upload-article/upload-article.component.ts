// src/app/components/upload-article/upload-article.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ArticlesService } from '../../services/articles.service';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/user.model';
import { Theme } from '../../models/theme.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upload-article',
  templateUrl: './upload-article.component.html',
  styleUrls: ['./upload-article.component.css'] 
})
export class UploadArticleComponent implements OnInit, OnDestroy {
  public articleForm!: FormGroup;
  public pdfFile: File | null = null;
  public pdfFileName: string | null = null;
  public pdfError: boolean = false;
  public currentUser: UserProfile | null = null;
  public themes: Theme[] = [];
  public popupMessage: string = '';
  public popupType: 'success' | 'error' | '' = '';
  public selectedFile: File | null = null; // Para la imagen seleccionada
  public loading: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder, 
    private articlesService: ArticlesService, 
    private authService: AuthService,
    private router: Router
  ) { }

  public ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentUser();
    this.loadThemes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario de publicación de artículo.
   */
  private initializeForm(): void {
    this.articleForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(2000)]],
      theme: ['', Validators.required],
      source: ['', [Validators.required, Validators.maxLength(200)]],
      image: [null] // Campo para la imagen opcional
    });
  }

  /**
   * Carga el usuario actual.
   */
  private loadCurrentUser(): void {
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        user => {
          this.currentUser = user;
        },
        error => {
          console.error('Error al obtener el usuario actual:', error);
          this.showErrorMessage('Error al cargar los datos del usuario.');
        }
      );
  }

  /**
   * Carga las temáticas disponibles.
   */
  private loadThemes(): void {
    this.articlesService.getThemes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (themes: Theme[]) => {
          this.themes = themes;
          console.log(this.themes);
        },
        (error) => {
          console.error('Error al cargar las temáticas:', error);
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
   * Maneja el cambio de archivo de imagen seleccionado por el usuario.
   * @param event Evento de cambio de archivo.
   */
  public onImageChange(event: any): void {
    const file = event.target.files[0];
    if (file && this.isImageFile(file)) {
      this.selectedFile = file;
    } else {
      this.selectedFile = null;
      this.showErrorMessage('Por favor, selecciona una imagen válida (JPEG, PNG).');
    }
  }

  /**
   * Verifica si el archivo es una imagen válida.
   * @param file Archivo a verificar.
   * @returns `true` si es una imagen válida, de lo contrario `false`.
   */
  private isImageFile(file: File): boolean {
    const validImageTypes = ['image/jpeg', 'image/png'];
    return validImageTypes.includes(file.type);
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
    if (this.currentUser && this.articleForm.valid && this.pdfFile) {
      if (!this.puedePublicar()) {
        this.showErrorMessage('No tienes suficiente reputación para publicar.');
        return;
      }

      this.loading = true;

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

      this.articlesService.uploadArticle(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          response => {
            console.log('Artículo subido con éxito', response);
            this.showSuccessMessage('Artículo subido con éxito.');
            this.resetForm();
            this.loading = false;
            // Navegar a otra ruta si es necesario
            // this.router.navigate(['/ruta-destino']);
          },
          error => {
            console.error('Error al subir el artículo', error);
            if (error.error && error.error.message) {
              this.showErrorMessage(`Error: ${error.error.message}`);
            } else {
              this.showErrorMessage('Error al subir el artículo.');
            }
            this.loading = false;
          }
        );
    } else {
      if (!this.pdfFile) {
        this.showErrorMessage('El archivo PDF es requerido.');
      }
      console.error('Formulario inválido');
      this.showErrorMessage('Formulario inválido.');
    }
  }

  /**
   * Resetea el formulario y las variables relacionadas con archivos.
   */
  private resetForm(): void {
    this.articleForm.reset();
    this.pdfFile = null;
    this.pdfFileName = null;
    this.selectedFile = null;
  }

  /**
   * Mensajes de notificación.
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
