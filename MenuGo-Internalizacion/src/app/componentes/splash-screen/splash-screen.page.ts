import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.page.html',
  styleUrls: ['./splash-screen.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IMPORTS_IONIC]
})
export class SplashScreenPage implements OnInit {

  public show = true;
  bubbles: any[] = [];
  animateSplash = false;
  private authService: AuthService = inject(AuthService);
  data: any = null;

  ngOnInit() {

    this.data = this.authService.getUserData();
    this.initializeBubbles();

    console.log("Entramos");
    setTimeout(() => {
      this.show = false;
    }, 3000); 
  }

  private initializeBubbles() {
    // Generar burbujas con posiciones y tamaños aleatorios
    for (let i = 0; i < 15; i++) {
      const size = Math.random() * 40 + 10;
      const left = Math.random() * 100;
      const delay = Math.random() * 10;
      const duration = Math.random() * 10 + 10;
      
      this.bubbles.push({
        'width.px': size,
        'height.px': size,
        'left.%': left,
        'animation-delay.s': delay,
        'animation-duration.s': duration
      });
    }
  }
}
