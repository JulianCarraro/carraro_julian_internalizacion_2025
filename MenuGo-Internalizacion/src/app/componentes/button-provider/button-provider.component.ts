import { NgOptimizedImage } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';


export type Provider = 'github' | 'google';

@Component({
  selector: 'app-button-provider',
  templateUrl: './button-provider.component.html',
  styleUrls: ['./button-provider.component.scss'],
})
export class ButtonProviderComponent {
  @Input() isLogin = false;
  @Output() googleLogin = new EventEmitter<void>();

  private _authService = inject(AuthService);
  private _router = inject(Router);

  providerAction(provider: Provider): void {
    if (provider === 'google') {
      this.signUpWithGoogle();
    } else {
      this.signUpWithGithub();
    }
  }

  // async signUpWithGoogle(): Promise<void> {
  //   try {
  //     const result = await this._authService.signInWithGoogleProvider();
  //     this._router.navigateByUrl('/');
  //     console.log(result);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }
  async signUpWithGoogle(): Promise<void> {
    this.googleLogin.emit();
  }
  async signUpWithGithub(): Promise<void> {
    // try {
    //   const result = await this._authService.signInWithGithubProvider();
    //   this._router.navigateByUrl('/');
    //   console.log(result);
    // } catch (error) {
    //   console.log(error);
    // }
  }
}