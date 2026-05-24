import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthSessionService } from '@core/auth/auth-session.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  protected loggingOut = false;
  protected mobileMenuOpen = false;

  constructor(
    protected readonly authSession: AuthSessionService,
    protected readonly router: Router
  ) {}

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  protected logout(): void {
    this.loggingOut = true;

    this.authSession.logout()
      .pipe(finalize(() => (this.loggingOut = false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/login']);
        },
        error: () => {
          this.authSession.clearSession();
          void this.router.navigate(['/login']);
        }
      });
  }
}
