import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonModal, IonButtons, IonCardSubtitle } from '@ionic/angular/standalone';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { AuthService } from 'src/app/services/auth.service';
import { checkmarkOutline, closeOutline, logOut } from 'ionicons/icons';
import { ToastController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { EmailService } from 'src/app/services/email.service';
import { register } from 'swiper/element/bundle';
import { LanguageService } from 'src/app/services/language.service';
import { MapaidiomaPage } from "../mapaidioma/mapaidioma.page";

register();

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  standalone: true,
  imports: [IonCardSubtitle, CommonModule, FormsModule, IMPORTS_IONIC, MapaidiomaPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UsuariosPage implements OnInit {

  isLoading: boolean = false;
  usuarios: any[] = []
  checkIcon = checkmarkOutline;
  closeIcon = closeOutline;
  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);

  textos: any = {
    es: {
      titulo: 'Usuarios',
      dni: 'DNI',
      creado: 'Creado',
      altAvatar: 'Avatar de',
      toasts: {
        aprobado: 'Usuario aprobado',
        rechazado: 'Usuario rechazado',
        errorAprobar: 'Error al aprobar usuario',
        errorRechazar: 'Error al rechazar usuario'
      }
    },
    en: {
      titulo: 'Users',
      dni: 'ID',
      creado: 'Created',
      altAvatar: 'Avatar of',
      toasts: {
        aprobado: 'User approved',
        rechazado: 'User rejected',
        errorAprobar: 'Error approving user',
        errorRechazar: 'Error rejecting user'
      }
    },
    pt: {
      titulo: 'Usuários',
      dni: 'Documento',
      creado: 'Criado',
      altAvatar: 'Avatar de',
      toasts: {
        aprobado: 'Usuário aprovado',
        rechazado: 'Usuário rejeitado',
        errorAprobar: 'Erro ao aprovar usuário',
        errorRechazar: 'Erro ao rejeitar usuário'
      }
    },
    fr: {
      titulo: 'Utilisateurs',
      dni: 'ID',
      creado: 'Créé',
      altAvatar: 'Avatar de',
      toasts: {
        aprobado: 'Utilisateur approuvé',
        rechazado: 'Utilisateur rejeté',
        errorAprobar: 'Erreur lors de l’approbation',
        errorRechazar: 'Erreur lors du rejet'
      }
    },
    de: {
      titulo: 'Benutzer',
      dni: 'Ausweis',
      creado: 'Erstellt',
      altAvatar: 'Avatar von',
      toasts: {
        aprobado: 'Benutzer genehmigt',
        rechazado: 'Benutzer abgelehnt',
        errorAprobar: 'Fehler beim Genehmigen',
        errorRechazar: 'Fehler beim Ablehnen'
      }
    },
    ru: {
      titulo: 'Пользователи',
      dni: 'ID',
      creado: 'Создан',
      altAvatar: 'Аватар',
      toasts: {
        aprobado: 'Пользователь одобрен',
        rechazado: 'Пользователь отклонён',
        errorAprobar: 'Ошибка при одобрении пользователя',
        errorRechazar: 'Ошибка при отклонении пользователя'
      }
    },
    ja: {
      titulo: 'ユーザー',
      dni: 'ID',
      creado: '作成日',
      altAvatar: 'アバター',
      toasts: {
        aprobado: 'ユーザーが承認されました',
        rechazado: 'ユーザーが拒否されました',
        errorAprobar: 'ユーザー承認中にエラーが発生しました',
        errorRechazar: 'ユーザー拒否中にエラーが発生しました'
      }
    }
  };

  constructor(private authService: AuthService, private toastCtrl: ToastController,
    private router: Router, private emailService: EmailService) {
    addIcons({ logOut });
  }

  ngOnInit() {
    this.obtenerUsuariosPendientes();

    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  private async presentToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1500,
      color
    });
    toast.present();
  }

  obtenerUsuariosPendientes() {

    this.isLoading = true;
    this.authService.obtenerUsuariosPendientesAprobacion()
      .subscribe(users => {
        this.usuarios = users.map(u => {
          let fecha: Date;
          if (u.fechaCreacion?.toDate) {
            fecha = (u.fechaCreacion as any).toDate();
          } else {

            const ts = u.fechaCreacion as { seconds: number; nanoseconds: number };
            fecha = new Date(ts.seconds * 1000 + ts.nanoseconds / 1e6);
          }

          return {
            ...u,
            fechaCreacion: fecha
          };
        })

        console.log("usuarios", this.usuarios)
        this.isLoading = false;
      })
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

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async acceptUser(userId: string, userName: string, userEmail: string) {
    this.isLoading = true;
    await this.delay(1500);

    try {
      await this.authService.acceptUser(userId);
      // this.usuarios = this.usuarios.filter(u => u.id !== userId);
      await this.emailService.sendApprovedEmail(userName, userEmail);

      await this.presentToast(this.textos[this.currentLang].toasts.aprobado, 'success');
      this.isLoading = false;
    } catch {
      this.presentToast(this.textos[this.currentLang].toasts.errorAprobar, 'danger');
      this.isLoading = false;
    }
  }


  async rejectUser(userId: string, userName: string, userEmail: string) {
    this.isLoading = true;
    await this.delay(1500);

    try {
      await this.authService.rejectUser(userId);
      await this.emailService.sendRejectedEmail(userName, userEmail);

      // this.usuarios = this.usuarios.filter(u => u.id !== userId);
      await this.presentToast(this.textos[this.currentLang].toasts.rechazado, 'danger');
      this.isLoading = false;
    } catch {
      this.presentToast(this.textos[this.currentLang].toasts.errorRechazar, 'danger');
      this.isLoading = false;
    }
  }

}
