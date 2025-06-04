import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.getCurrentUser().subscribe(user => {
      this.isLoggedIn = !!user; 
    });
  }

  /**
   * Logout
   */
  logout() {
    this.authService.logout().subscribe(() => {
      this.isLoggedIn = false; 
      this.router.navigate(['/login']);
    });
  }
}
