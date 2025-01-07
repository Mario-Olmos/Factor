import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Article } from '../../../models/article.model';
import { User } from '../../../models/user.model';
import { ActivatedRoute } from '@angular/router';
import { ArticlesService } from '../../../services/articles.service';
import { AuthService } from '../../../services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-articulo-detail',
  templateUrl: './articulo-detail.component.html',
  styleUrl: './articulo-detail.component.css'
})
export class ArticuloDetailComponent implements OnInit {
  @ViewChild('pdfIframe') pdfIframe!: ElementRef;
  currentUser: User | null = null;
  errorMessage: string = '';
  article: Article | null = null;
  pdfSrc!: any;


  constructor(
    private route: ActivatedRoute,
    private articlesService: ArticlesService,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    
    this.authService.getCurrentUser().subscribe(
      (user) => {
        this.currentUser = user;
      },
      (error) => {
        console.error('Error al obtener el usuario actual:', error);
        this.errorMessage = 'Error al cargar los datos del usuario.';
      }
    );

    // Obtiene el ID del artículo de la URL y carga los datos
    const articleId = this.route.snapshot.paramMap.get('id');
    if (articleId) {
      this.loadArticle(articleId, this.currentUser!.userId);
    } else {
      this.errorMessage = 'ID del artículo no válido.';
    }
  }

  //Cargamos información del artículo
  private loadArticle(articleId: string, userId: string): void {
    this.articlesService.getArticleById(articleId, userId).subscribe(
      (article: any) => {
        
        if (article.createdAt) {
          article.createdAt = new Date(article.createdAt);
        }

        this.article = article;
        this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(
          `http://localhost:3000/api${this.article?.pdfUrl}`
        );
        console.log(this.currentUser);
        console.log(this.pdfSrc);
        console.log(this.article);
      },
      (error: any) => {
        console.error('Error al cargar el artículo:', error);
        this.errorMessage = 'No se pudo cargar el artículo.';
      }
    );
  }

  // Cambia el color de la veracidad en funcion a su valor
  getVeracityColor(veracity: number): string {
    if (veracity < 5) {
      return '#FF4D4D'; 
    } else if (veracity < 7) {
      return '#FFC107'; 
    } else {
      return '#4CAF50'; 
    }
  }

  puedeVotar(): boolean {
    return this.currentUser!.reputacion >= 50;
  }

  darLike(articleId: String): void {
    if (!this.puedeVotar()) {
      alert('No tienes suficiente reputación para votar');
      return;
    }
    const likeObject = {
      articleId,
      user: this.currentUser?.userId,
      voteType: 'upvote'
    };
    this.articlesService.darLike(likeObject).subscribe();
  }

  darDislike(articleId: String): void {
    if (!this.puedeVotar()) {
      alert('No tienes suficiente reputación para votar');
      return;
    }
    const dislikeObject = {
      articleId,
      user: this.currentUser?.userId,
      voteType: 'downvote'
    };
    this.articlesService.darDislike(dislikeObject).subscribe();
  }

  toggleFullScreen() {
    const iframeElement = this.pdfIframe.nativeElement;
    
    if (iframeElement.requestFullscreen) {
      iframeElement.requestFullscreen();
    } else if (iframeElement.mozRequestFullScreen) { /* Firefox */
      iframeElement.mozRequestFullScreen();
    } else if (iframeElement.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
      iframeElement.webkitRequestFullscreen();
    } else if (iframeElement.msRequestFullscreen) { /* IE/Edge */
      iframeElement.msRequestFullscreen();
    }
  }
}
