import { Component, OnInit } from '@angular/core';
import { ArticlesService } from '../../services/articles.service';
import { AuthService } from '../../services/auth.service';
import { Theme } from '../../models/theme.model';
import { Article } from '../../models/article.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  themes: Theme[] = [];
  articles: Article[] = [];
  currentUser: User | null = null;

  constructor(private articlesService: ArticlesService, private authService: AuthService) { }

  ngOnInit(): void {

    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });

    this.articlesService.getThemes().subscribe(
      (themes: Theme[]) => {
        this.themes = themes;
      },
      (error) => {
        console.error('Error al cargar las temáticas', error);
      }
    );

    this.articlesService.getArticles().subscribe(
      (articles: Article[]) => {
        this.articles = articles;
      },
      (error) => {
        console.error('Error al cargar los artículos', error);
      }
    )
  }

  // Verificar si el usuario puede votar
  puedeVotar(): boolean {
    if(this.currentUser!.reputacion >= 50){
      return true;
    }else return false;
  }

  // Calcular el peso del voto según la reputación del votante
  calcularPesoVoto(): number {
    const pesoVoto = 1 + (this.currentUser!.reputacion / 100);
    return Math.min(pesoVoto, 2.0);  // Limitar a 2.0 como máximo
  }

  // Método para dar "Like"
  darLike(articleId: String): void {
    if (!this.puedeVotar()) {
      alert('No tienes suficiente reputación para votar');
      return;
    }

    const pesoVoto = this.calcularPesoVoto();

    const likeObject = {
      articleId: articleId,
      pesoVoto: pesoVoto,
      user: this.currentUser?.userId,
      voteType: "upvote"
    }

    this.articlesService.darLike(likeObject).subscribe(
      response => {
        this.articlesService.getArticles(); 
      },
      error => {
        alert('Error al votar');
      }
    );
  }

  // Método para dar "Dislike"
  /*darDislike(articuloId: number): void {
    if (!this.puedeVotar()) {
      alert('No tienes suficiente reputación para votar');
      return;
    }

    const pesoVoto = this.calcularPesoVoto();

    this.articuloService.darDislike(articuloId, pesoVoto).subscribe(
      response => {
        alert('¡Voto negativo registrado!');
        this.cargarArticulos();  // Volver a cargar artículos para ver cambios en veracidad
      },
      error => {
        alert('Error al registrar el voto negativo');
      }
    );
  }*/
}
