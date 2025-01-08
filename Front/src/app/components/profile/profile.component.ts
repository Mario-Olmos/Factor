import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../models/user.model';
import { Article } from '../../models/article.model';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
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
  profileForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private fb: FormBuilder,
    private articlesService: ArticlesService
  ) { };

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

  editProfile(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.initForm(); // Inicializa el formulario con los datos actuales
    }
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      nombre: [this.user.nombre, Validators.required],
      apellidos: [this.user.apellidos, Validators.required],
      fechaNacimiento: [
        this.user.fechaNacimiento ? this.formatDateForInput(new Date(this.user.fechaNacimiento)) : '',
        Validators.required
      ],
      imagenPerfil: [this.user.imagenPerfil || ''],
      acreditaciones: this.fb.array(this.user.acreditaciones.map(ac => this.createAccreditationGroup(ac)))
    });
  }
  
  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get acreditaciones(): FormArray {
    return this.profileForm.get('acreditaciones') as FormArray;
  }

  createAccreditationGroup(ac: any = { title: '', institution: '', year: '' }): FormGroup {
    return this.fb.group({
      title: [ac.title, Validators.required],
      institution: [ac.institution, Validators.required],
      year: [ac.year, [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]]
    });
  }

  addAccreditation(): void {
    this.acreditaciones.push(this.createAccreditationGroup());
  }

  removeAccreditation(index: number): void {
    this.acreditaciones.removeAt(index);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  loadUserProfile(): void {
    // a) Cargamos al usuario del perfil
    this.authService.getUserById(this.userId).subscribe({
      next: (data) => {
        this.user = data.user;
        this.initForm(); // por si tienes lógica para inicializar tu formulario

        // b) Cargamos los artículos (authorId = this.userId, viewerId = this.currentUser.userId)
        this.loadArticlesByUser();
      },
      error: (error) => {
        console.error('Error al cargar el perfil del usuario:', error);
      }
    });
  }

  loadArticlesByUser(): void {
    const authorId = this.userId;
    const viewerId = this.currentUser!.userId;

    this.articlesService.getArticlesByUser(authorId, viewerId).subscribe({
      next: (articles) => {
        this.articles = articles;
      },
      error: (error) => {
        console.error('Error al cargar los artículos del usuario:', error);
      }
    });
  }

  updateForm(): void {
    this.profileForm.patchValue({
      nombre: this.user.nombre,
      apellidos: this.user.apellidos,
      fechaNacimiento: this.user.fechaNacimiento,
      imagenPerfil: this.user.imagenPerfil
    });

    const acreditacionesArray = this.acreditaciones;
    acreditacionesArray.clear(); 

    this.user.acreditaciones.forEach(ac => {
      acreditacionesArray.push(this.createAccreditationGroup(ac));
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files && input.files[0]) {
      const file = input.files[0];
      console.log('Archivo seleccionado:', file);
      // Aquí se puede manejar la carga del archivo (subida al servidor o previsualización)
    }
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      console.log('Formulario válido. Enviando datos:', this.profileForm.value);
      this.authService.updateProfile(this.profileForm.value, this.user._id).subscribe({
        next: (data) => {
          this.user = data.user; // Actualizamos el usuario con los datos del servidor
          this.isEditing = false; // Salimos del modo de edición
          console.log('Perfil actualizado con éxito.');
        },
        error: (error) => {
          console.error('Error al guardar los cambios:', error);
        }
      });
    } else {
      console.error('Formulario no válido. Revisa los errores.');
    }
  }
}
