import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ArticlesService } from '../../services/articles.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { Theme } from '../../models/theme.model';

@Component({
  selector: 'app-upload-article',
  templateUrl: './upload-article.component.html',
  styleUrl: './upload-article.component.css'
})
export class UploadArticleComponent implements OnInit{
  articleForm!: FormGroup;
  pdfFile: File | null = null;
  pdfFileName: string | null = null;
  pdfError: boolean = false;
  currentUser: User | null = null;
  themes: Theme[] = [];

  constructor(private fb: FormBuilder, private articlesService: ArticlesService, private authService: AuthService) {
  }

  ngOnInit(): void {
    this.articleForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      theme: ['', Validators.required],
      source: ['', Validators.required]
    });

    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });

    this.articlesService.getThemes().subscribe(
      (themes: Theme[]) => {
        this.themes = themes;
        console.log(this.themes);
      },
      (error) => {
        console.error('Error al cargar las temáticas', error);
      }
    );
  }

  // Maneja el cambio de archivo PDF
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.pdfFile = file;
      this.pdfFileName = file.name;
      this.pdfError = false;
    } else {
      this.pdfFile = null;
      this.pdfFileName = null;
      this.pdfError = true;
    }
  }

  // Verificar si el usuario puede publiccar
  puedePublicar(): boolean {
    if(this.currentUser!.reputacion < 15){
      return false;
    }else return true;
  }

  // Envío del formulario
  onSubmit(): void {
    if (this.currentUser && this.articleForm.valid) {
      if(!this.puedePublicar){
        alert('No tienes suficiente reputación para publicar');
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
      formData.append('author', this.currentUser.userId);

      this.articlesService.uploadArticle(formData).subscribe(
        response => {
          console.log('Artículo subido con éxito', response);
          setTimeout(() => {
            window.location.reload(); 
          }, 2000);
        },
        error => {
          console.error('Error al subir el artículo', error);
        }
      );
    } else {
      console.error('Formulario inválido o usuario no logueado');
    }
  }
}