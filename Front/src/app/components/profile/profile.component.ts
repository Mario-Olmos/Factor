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
  BACKEND_URL = 'http://localhost:3000/';

  selectedFile: File | null = null; // Para la imagen seleccionada

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private fb: FormBuilder,
    private articlesService: ArticlesService
  ) { }

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;

        this.route.params.subscribe((params) => {
          const requestedUserId = params['id'];

          if (!requestedUserId || requestedUserId === 'me') {
            this.userId = this.currentUser!.userId;
            this.isOwnProfile = true;
          } else {
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

  loadUserProfile(): void {
    this.authService.getUserById(this.userId).subscribe({
      next: (data) => {
        this.user = data.user;
        this.initForm();
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

  getFullImageUrl(rel: string | undefined): string {
    if (!rel) return 'assets/images/default-avatar.png';
    return this.BACKEND_URL + rel;
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      nombre: [this.user.nombre, Validators.required],
      apellidos: [this.user.apellidos, Validators.required],
      fechaNacimiento: [
        this.user.fechaNacimiento
          ? this.formatDateForInput(new Date(this.user.fechaNacimiento))
          : '',
        Validators.required
      ],
      imagenPerfil: [this.user.imagenPerfil || ''],
      acreditaciones: this.fb.array(
        this.user.acreditaciones.map(ac => this.createAccreditationGroup(ac))
      )
    });
  }

  createAccreditationGroup(ac: any = { title: '', institution: '', year: '' }): FormGroup {
    return this.fb.group({
      title: [ac.title, Validators.required],
      institution: [ac.institution, Validators.required],
      year: [
        ac.year,
        [
          Validators.required,
          Validators.min(1900),
          Validators.max(new Date().getFullYear())
        ]
      ]
    });
  }

  get acreditaciones(): FormArray {
    return this.profileForm.get('acreditaciones') as FormArray;
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

  editProfile(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.initForm();
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile = file;
      console.log('Archivo seleccionado:', file);
    }
  }

  saveProfile(): void {
    if (!this.profileForm.valid) {
      console.error('Formulario no válido. Revisa los errores.');
      return;
    }

    // CASO A: El usuario NO subió ninguna imagen => Envío JSON normal
    if (!this.selectedFile) {
      const userJson = {
        nombre: this.profileForm.value.nombre,
        apellidos: this.profileForm.value.apellidos,
        fechaNacimiento: this.profileForm.value.fechaNacimiento,
        acreditaciones: this.profileForm.value.acreditaciones,
        // Si quieres mandar más campos (email, etc.), añádelos
      };

      this.authService.updateProfile(userJson, this.user._id).subscribe({
        next: (resp) => {
          this.user = resp.user;
          this.isEditing = false;
          console.log('Perfil actualizado sin imagen.');
        },
        error: (err) => {
          console.error('Error actualizando perfil:', err);
        }
      });

      // CASO B: El usuario SÍ seleccionó imagen => Envío FormData (multipart/form-data)
    } else {
      const formData = new FormData();
      formData.append('nombre', this.profileForm.value.nombre);
      formData.append('apellidos', this.profileForm.value.apellidos);
      formData.append('fechaNacimiento', this.profileForm.value.fechaNacimiento);

      // Acreditaciones (si quieres enviarlas también)
      formData.append('acreditaciones', JSON.stringify(this.profileForm.value.acreditaciones));

      // La imagen
      formData.append('imagenPerfil', this.selectedFile);

      this.authService.updateProfile(formData, this.user._id).subscribe({
        next: (resp) => {
          this.user = resp.user;
          this.isEditing = false;
          console.log('Perfil actualizado con imagen.');
        },
        error: (err) => {
          console.error('Error actualizando perfil:', err);
        }
      });
    }
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
