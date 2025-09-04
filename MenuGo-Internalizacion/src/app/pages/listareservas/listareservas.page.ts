import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { AuthService } from 'src/app/services/auth.service';
import { checkmarkOutline, closeOutline, logOut } from 'ionicons/icons';
import { ToastController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';

import { register } from 'swiper/element/bundle';
import { ReservaService } from 'src/app/services/reserva.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { LanguageService } from 'src/app/services/language.service';
import { MapaidiomaPage } from "../mapaidioma/mapaidioma.page";

register();

@Component({
  selector: 'app-listareservas',
  templateUrl: './listareservas.page.html',
  styleUrls: ['./listareservas.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IMPORTS_IONIC, MapaidiomaPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ListareservasPage implements OnInit {

  isLoading: boolean = false;
  reservas: any[] = []
  checkIcon = checkmarkOutline;
  closeIcon = closeOutline;
  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);

  textos: any = {
    es: {
      titulo: 'Reservas',
      reservado: 'Reservado',
      altAvatar: 'Avatar de',
      toasts: {
        aprobado: 'Reserva aprobada',
        rechazado: 'Reserva rechazada',
        errorAprobar: 'Error al aprobar la reserva',
        errorRechazar: 'Error al rechazar la reserva'
      }
    },
    en: {
      titulo: 'Reservations',
      reservado: 'Reserved',
      altAvatar: 'Avatar of',
      toasts: {
        aprobado: 'Reservation approved',
        rechazado: 'Reservation rejected',
        errorAprobar: 'Error approving reservation',
        errorRechazar: 'Error rejecting reservation'
      }
    },
    pt: {
      titulo: 'Reservas',
      reservado: 'Reservado',
      altAvatar: 'Avatar de',
      toasts: {
        aprobado: 'Reserva aprovada',
        rechazado: 'Reserva rejeitada',
        errorAprobar: 'Erro ao aprovar reserva',
        errorRechazar: 'Erro ao rejeitar reserva'
      }
    },
    fr: {
      titulo: 'Réservations',
      reservado: 'Réservé',
      altAvatar: 'Avatar de',
      toasts: {
        aprobado: 'Réservation approuvée',
        rechazado: 'Réservation rejetée',
        errorAprobar: 'Erreur lors de l’approbation de la réservation',
        errorRechazar: 'Erreur lors du rejet de la réservation'
      }
    },
    de: {
      titulo: 'Reservierungen',
      reservado: 'Reserviert',
      altAvatar: 'Avatar von',
      toasts: {
        aprobado: 'Reservierung genehmigt',
        rechazado: 'Reservierung abgelehnt',
        errorAprobar: 'Fehler beim Genehmigen der Reservierung',
        errorRechazar: 'Fehler beim Ablehnen der Reservierung'
      }
    },
    ru: {
      titulo: 'Бронирования',
      reservado: 'Забронировано',
      altAvatar: 'Аватар',
      toasts: {
        aprobado: 'Бронирование одобрено',
        rechazado: 'Бронирование отклонено',
        errorAprobar: 'Ошибка при одобрении бронирования',
        errorRechazar: 'Ошибка при отклонении бронирования'
      }
    },
    ja: {
      titulo: '予約',
      reservado: '予約済み',
      altAvatar: 'アバター',
      toasts: {
        aprobado: '予約が承認されました',
        rechazado: '予約が拒否されました',
        errorAprobar: '予約承認中にエラーが発生しました',
        errorRechazar: '予約拒否中にエラーが発生しました'
      }
    }
  };

  constructor(private authService: AuthService, private toastCtrl: ToastController,
    private router: Router, private reservaService: ReservaService, private clienteService: ClienteService
  ) {
    addIcons({ logOut });
  }

  ngOnInit() {
    this.obtenerReservasPendientes();

    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  obtenerReservasPendientes() {
    this.isLoading = true;

    this.reservaService.obtenerReservasPendientesAprobacion()
      .subscribe(async raw => {
        // 1) convierte el timestamp en Date
        const reservas = raw.map(u => {
          let fecha: Date;
          if (u.startTime?.toDate) {
            fecha = (u.startTime as any).toDate();
          } else {
            const ts = u.startTime as { seconds: number; nanoseconds: number };
            fecha = new Date(ts.seconds * 1000 + ts.nanoseconds / 1e6);
          }
          return { ...u, startTime: fecha };
        });

        // 2) por cada reserva, trae al cliente y lo añade
        const reservasConCliente = await Promise.all(
          reservas.map(async r => {
            const cliente = await this.clienteService.getClientePorId(r.clienteId);
            return { ...r, cliente };
          })
        );

        // 3) guarda el resultado ya enriquecido
        this.reservas = reservasConCliente;
        console.log('reservas con cliente:', this.reservas);

        this.isLoading = false;
      }, err => {
        console.error(err);
        this.isLoading = false;
      });
  }

  async cambiarEstadoReserva(idReserva: string, estadoCliente: string, idCliente: string, estadoUsuario: string) {
    this.isLoading = true;
    console.log("entramos");

    try {
      await this.reservaService.cambiarEstadoReserva(idReserva, estadoCliente);
      await this.clienteService.cambiarEstadoUsuario(idCliente, estadoUsuario)
      // this.usuarios = this.usuarios.filter(u => u.id !== userId);

      await this.presentToast(this.textos[this.currentLang].toasts.aprobado, 'success');
      this.isLoading = false;
    } catch {
      this.presentToast(this.textos[this.currentLang].toasts.errorAprobar, 'danger');
      this.isLoading = false;
    }
  }


  // async rejectUser(userId: string, userName: string, userEmail: string) {
  //   this.isLoading = true;

  //   try {
  //     await this.authService.rejectUser(userId);

  //     // this.usuarios = this.usuarios.filter(u => u.id !== userId);
  //     await this.presentToast('Usuario rechazado', 'danger');
  //     this.isLoading = false;
  //   } catch {
  //     this.presentToast('Error al rechazar usuario', 'danger');
  //     this.isLoading = false;
  //   }
  // }

  private async presentToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1500,
      color
    });
    toast.present();
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
