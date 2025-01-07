import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../models/user.model';
import { Article } from '../../models/article.model';
import { AuthService } from '../../services/auth.service';
import { ArticlesService } from '../../services/articles.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  userId!: string;
  isOwnProfile: boolean = false;
  user!: User;
  articles: Article[] = [];
  errorMessage: string = '';
  currentUser: User | null = null;
  activeTab: string = 'info'; 

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private articlesService: ArticlesService
  ) { }

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
  
        // Comprobamos si la ruta tiene el parámetro `id` o es `/perfil/me`
        this.route.params.subscribe((params) => {
          const requestedUserId = params['id']; 
  
          if (!requestedUserId || requestedUserId === 'me') {
            this.userId = this.currentUser!.userId;
            this.isOwnProfile = true;
          } else {
            // Caso: Perfil de otro usuario
            this.userId = requestedUserId;
            this.isOwnProfile = false;
          }
  
          console.log(`Perfil cargado: ${this.isOwnProfile ? 'propio' : 'otro usuario'}`);
          this.loadUserProfile();
        });
      },
      error: (error) => {
        console.error('Error al obtener el usuario actual:', error);
        this.errorMessage = 'Error al autenticar al usuario.';
      },
    });
  }
  

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  loadUserProfile(): void {

    this.authService.getUserById(this.userId).subscribe({
      next: (data) => {
        this.user = data.user;
        console.log(this.user);
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar el perfil del usuario.';
        console.error(error);
      }
    });
  }

  editProfile(): void {
    // Lógica para editar el perfil (puede abrir un modal o redirigir a otra página).
    console.log('Editar perfil');
  }
}
