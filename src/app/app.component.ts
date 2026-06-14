import { Component, effect, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, finalize } from 'rxjs';

import { AuthSessionService } from '@core/auth/auth-session.service';
import { CatalogContextService } from '@core/context/catalog-context.service';
import { AppHeaderComponent } from '@core/layout/app-header.component';
import { CatalogContextSelectorComponent } from '@shared/components/catalog-context-selector/catalog-context-selector.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AppHeaderComponent, CatalogContextSelectorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  protected loggingOut = false;
  protected mobileMenuOpen = false;
  protected contextDrawerOpen = false;
  protected readonly routeRequiresCatalogContext = signal(false);
  protected readonly currentRouteUrl = signal('');

  constructor(
    protected readonly authSession: AuthSessionService,
    protected readonly router: Router,
    protected readonly catalogContext: CatalogContextService,
    private readonly activatedRoute: ActivatedRoute
  ) {
    this.updateRouteContextRequirement();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeMobileMenu();
        this.updateRouteContextRequirement();
      });

    effect(() => {
      this.currentRouteUrl();
      if (this.missingRequiredCatalogContext) {
        this.openContextDrawer();
      }
    });
  }

  protected get requiresCatalogContext(): boolean {
    return this.routeRequiresCatalogContext();
  }

  protected get hasCatalogContext(): boolean {
    return this.catalogContext.hasCatalogContext();
  }

  protected get missingRequiredCatalogContext(): boolean {
    return this.requiresCatalogContext && !this.hasCatalogContext;
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  protected openContextDrawer(): void {
    this.contextDrawerOpen = true;
  }

  protected closeContextDrawer(): void {
    this.contextDrawerOpen = false;
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

  private updateRouteContextRequirement(): void {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const requiresCatalogContext = Boolean(route.snapshot.data['requiresCatalogContext']);
    this.routeRequiresCatalogContext.set(requiresCatalogContext);
    this.currentRouteUrl.set(this.router.url);

    if (!requiresCatalogContext) {
      this.closeContextDrawer();
    }
  }
}
