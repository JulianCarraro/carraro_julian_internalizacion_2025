import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon } from '@ionic/angular/standalone';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { addCircleOutline, logOut, receiptOutline } from 'ionicons/icons';
import { MapaidiomaPage } from "../mapaidioma/mapaidioma.page";
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-homeempleados',
  templateUrl: './homeempleados.page.html',
  styleUrls: ['./homeempleados.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IMPORTS_IONIC, MapaidiomaPage]
})
export class HomeempleadosPage {

  isLoading: boolean = false;
  titulo: string = "plato";
  userData: any;
  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);

  textos: any = {
    es: {
      header: 'Empleados',
      crear: 'Crear',
      pedidos: 'Pedidos',
      roles: { plato: 'plato', bebida: 'bebida' },
      toasts: {
        // por si en el futuro agregás toasts aquí
        logout: 'Sesión cerrada'
      }
    },
    en: {
      header: 'Staff',
      crear: 'Create',
      pedidos: 'Orders',
      roles: { plato: 'dish', bebida: 'drink' },
      toasts: {
        logout: 'Logged out'
      }
    },
    pt: {
      header: 'Funcionários',
      crear: 'Criar',
      pedidos: 'Pedidos',
      roles: { plato: 'prato', bebida: 'bebida' },
      toasts: {
        logout: 'Sessão encerrada'
      }
    },
    fr: {
      header: 'Employés',
      crear: 'Créer',
      pedidos: 'Commandes',
      roles: { plato: 'plat', bebida: 'boisson' },
      toasts: {
        logout: 'Déconnexion effectuée'
      }
    },
    de: {
      header: 'Mitarbeiter',
      crear: 'Erstellen',
      pedidos: 'Bestellungen',
      roles: { plato: 'Gericht', bebida: 'Getränk' },
      toasts: {
        logout: 'Abgemeldet'
      }
    },
    ru: {
      header: 'Сотрудники',
      crear: 'Создать',
      pedidos: 'Заказы',
      roles: { plato: 'блюдо', bebida: 'напиток' },
      toasts: {
        logout: 'Вы вышли из системы'
      }
    },
    ja: {
      header: 'スタッフ',
      crear: '作成',
      pedidos: '注文',
      roles: { plato: '料理', bebida: 'ドリンク' },
      toasts: {
        logout: 'ログアウトしました'
      }
    }
  };

  constructor(private router: Router, private authService: AuthService) {
    addIcons({ logOut, addCircleOutline, receiptOutline });
  }

  ngOnInit() {

    this.userData = this.authService.getUserData();
    console.log("userData", this.userData);
    // if (this.userData.tipoEmpleado == 'bartender') {
    //   this.titulo = "bebida"
    // }

    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  get tituloTraducido(): string {
    const roleKey = this.userData?.tipoEmpleado === 'bartender' ? 'bebida' : 'plato';
    return this.textos[this.currentLang].roles[roleKey];
  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  async onSelect(type: 'crearproducto' | 'pedidos'): Promise<void> {

    if (type == "crearproducto") {
      this.router.navigate(['altaproductos']);
    }
    else {
      this.router.navigate(['pedidos-empleado']);
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
