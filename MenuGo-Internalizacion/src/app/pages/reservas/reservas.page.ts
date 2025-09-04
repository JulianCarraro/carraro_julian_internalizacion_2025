import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, ToastController, IonListHeader, DatetimeChangeEventDetail } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { ReservaService } from 'src/app/services/reserva.service';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';

@Component({
  selector: 'app-reservas',
  templateUrl: './reservas.page.html',
  styleUrls: ['./reservas.page.scss'],
  standalone: true,
  imports: [IonListHeader, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IMPORTS_IONIC]
})
export class ReservasPage implements OnInit {
  // modelos para el formulario
  fecha!: string;
  franja!: string;
  mesasDisponibles: any[] = [];
  loading = false;
  busqueda = false;

  timeSlots = [
    { value: '12-13', label: '12:00 – 13:00' },
    { value: '13-14', label: '13:00 – 14:00' },
    { value: '14-15', label: '14:00 – 15:00' },
    { value: '19-20', label: '19:00 – 20:00' },
    { value: '20-21', label: '20:00 – 21:00' },
    { value: '21-22', label: '21:00 – 22:00' },
    { value: '22-23', label: '22:00 – 23:00' },
  ];

  constructor(
    private reservaSvc: ReservaService,
    private auth: AuthService,
    private toastCtrl: ToastController,
    private router: Router,
    private clienteService: ClienteService,
    private notificaionesService: NotificacionesService

  ) { }

  ngOnInit() {
    // iniciales
    const hoy = new Date();
    this.fecha = hoy.toISOString().slice(0, 10);
    this.franja = this.timeSlots[0].value;
  }

  /** Consulta mesas libres */
  async buscarDisponibles() {
    this.loading = true;
    try {
      const [h1, h2] = this.franja.split('-').map(n => +n);

      // Desglosa fecha YYYY-MM-DD
      const [year, month, day] = this.fecha
        .split('-')
        .map(n => parseInt(n, 10));

      // Fecha de inicio en zona local
      const start = new Date(year, month - 1, day);
      start.setHours(h1, 0, 0, 0);
      const end = new Date(year, month - 1, day);
      end.setHours(h2, 0, 0, 0);

      this.mesasDisponibles = await this.reservaSvc.getAvailableMesas(start, end);
    } catch (e: any) {
      this.presentToast(e.message, 'danger');
    } finally {
      this.loading = false;
    }
    this.busqueda = true;
  }

  /** Reserva la mesa seleccionada */
  async reservar(mesa: any) {
    const user = this.auth.getUserData();
    if (!user) {
      return this.presentToast('Debes iniciar sesión para reservar', 'warning');
    }
    this.loading = true;
    try {
      const [h1, h2] = this.franja.split('-').map(n => +n);

      // Desglosa fecha YYYY-MM-DD
      const [year, month, day] = this.fecha
        .split('-')
        .map(n => parseInt(n, 10));

      // Fecha de inicio en zona local
      const start = new Date(year, month - 1, day);
      start.setHours(h1, 0, 0, 0);
      console.log('start local:', start);

      const end = new Date(year, month - 1, day);
      end.setHours(h2, 0, 0, 0);

      const id = await this.reservaSvc.createReservation(
        mesa.id, user.id, start, end
      );
      this.presentToast(`Reserva creada con exito.`, 'success');
      await this.clienteService.cambiarEstadoUsuario(user.id, "esperando reserva");
      const formattedDate = `${start.getDate().toString().padStart(2, '0')}/${(start.getMonth() + 1).toString().padStart(2, '0')}`;
      this.notificaionesService.sendNotificationToAdmins("Nueva Reserva", `El cliente ${user.nombre} reservó la mesa #${mesa.numero} para la fecha: ${formattedDate}.`, "local");
      this.router.navigate(['/local'])
      // refresca disponibilidad
      // await this.buscarDisponibles();
    } catch (e: any) {
      this.presentToast(e.message, 'danger');
    } finally {
      this.loading = false;
    }
  }

  private async presentToast(msg: string, color: string = 'secondary') {
    const t = await this.toastCtrl.create({
      message: msg, duration: 2000, color
    });
    await t.present();
  }

  onDateChange(ev: any) {
    const raw: string = ev.detail.value;
    if (raw) {
      this.fecha = raw.substring(0, 10);
      console.log('fecha actualizada:', this.fecha);
    }
  }

  onFranjaChange(ev: any) {
    this.franja = ev.detail.value;
    console.log('franja actualizada:', this.franja);
  }

  async back() {
    this.router.navigate(["/local"]);
  }

}