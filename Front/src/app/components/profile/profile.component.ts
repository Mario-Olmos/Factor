import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../models/user.model';
import { Article } from '../../models/article.model';
import { FormGroup, FormControl, Validators } from '@angular/forms';
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
  isEditing: boolean = false;
  profileForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private articlesService: ArticlesService
  ) {
    this.profileForm = new FormGroup({
      nombre: new FormControl('', Validators.required),
      apellidos: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      fechaNacimiento: new FormControl(''),
      imagenPerfil: new FormControl(''),
      acreditaciones: new FormControl([]),  // Inicializa el campo de acreditaciones vacío
    });
  }

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
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.updateForm();
    }
  }

  updateForm(): void {
    this.profileForm.patchValue({
      nombre: this.user.nombre,
      apellidos: this.user.apellidos,
      email: this.user.email,
      fechaNacimiento: this.user.fechaNacimiento,
      imagenPerfil: this.user.imagenPerfil,
      acreditaciones: this.user.acreditaciones
    });
  }

  addAccreditation(): void {
    const acreditaciones = this.profileForm.get('acreditaciones')!.value;
    acreditaciones.push({ title: '', institution: '', year: 0 });
    this.profileForm.get('acreditaciones')!.setValue(acreditaciones);
  }

  removeAccreditation(index: number): void {
    const acreditaciones = this.profileForm.get('acreditaciones')!.value;
    acreditaciones.splice(index, 1);
    this.profileForm.get('acreditaciones')!.setValue(acreditaciones);
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      console.log(this.profileForm.value);
      // Guardamos los cambios del formulario en el objeto `user`
      this.authService.updateProfile(this.profileForm.value, this.user._id).subscribe({
        next: (data) => {
          this.user = data.user;
          this.isEditing = false;
        },
        error: (error) => {
          console.error('Error al guardar los cambios:', error);
        }
      });
    } else {
      console.error('Formulario no válido');
    }
  }
}
