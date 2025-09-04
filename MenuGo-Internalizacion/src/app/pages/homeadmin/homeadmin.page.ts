import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { addCircleOutline, logOut, person, receiptOutline, personOutline, calendarOutline } from 'ionicons/icons';
import { LanguageService } from 'src/app/services/language.service';
import { MapaidiomaPage } from "../mapaidioma/mapaidioma.page";

@Component({
  selector: 'app-homeadmin',
  templateUrl: './homeadmin.page.html',
  styleUrls: ['./homeadmin.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IMPORTS_IONIC, MapaidiomaPage]
})
export class HomeadminPage implements OnInit {

  isLoading: boolean = false;
  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);

  textos: any = {
    es: {
      titulo: 'Dueño',
      crearMesa: 'Crear Mesa',
      usuarios: 'Usuarios',
      reservas: 'Reservas'
    },
    en: {
      titulo: 'Owner',
      crearMesa: 'Create Table',
      usuarios: 'Users',
      reservas: 'Reservations'
    },
    pt: {
      titulo: 'Dono',
      crearMesa: 'Criar Mesa',
      usuarios: 'Usuários',
      reservas: 'Reservas'
    },
    fr: {
      titulo: 'Propriétaire',
      crearMesa: 'Créer une Table',
      usuarios: 'Utilisateurs',
      reservas: 'Réservations'
    },
    de: {
      titulo: 'Inhaber',
      crearMesa: 'Tisch Erstellen',
      usuarios: 'Benutzer',
      reservas: 'Reservierungen'
    },
    ru: {
      titulo: 'Владелец',
      crearMesa: 'Создать Стол',
      usuarios: 'Пользователи',
      reservas: 'Бронирования'
    },
    ja: {
      titulo: 'オーナー',
      crearMesa: 'テーブル作成',
      usuarios: 'ユーザー',
      reservas: '予約'
    }
  };

  constructor(private router: Router, private authService: AuthService) {
    addIcons({ logOut, addCircleOutline, personOutline, calendarOutline, receiptOutline, person });
  }

  ngOnInit() {
    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  async onSelect(type: 'crearmesa' | 'usuarios' | 'reservas'): Promise<void> {

    if (type == "crearmesa") {
      this.router.navigate(['altamesa']);
    }
    else if (type == 'usuarios') {
      this.router.navigate(['usuarios']);
    }
    else {
      this.router.navigate(['listareservas']);
    }
  }

  logOut() {
    this.isLoading = true;
    this.authService.logOut().then(() => {
      this.isLoading = false;
      this.router.navigate(['/home'], {
        queryParams: { limpiarCampos: true },
        replaceUrl: true
      });
    })
  }

}
