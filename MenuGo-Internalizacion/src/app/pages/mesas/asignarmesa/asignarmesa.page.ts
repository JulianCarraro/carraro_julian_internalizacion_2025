import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonButton } from '@ionic/angular/standalone';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { ClienteService } from 'src/app/services/cliente.service';
import { MesaService } from 'src/app/services/mesa.service';
import { ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { logOut, restaurantOutline, arrowBack } from 'ionicons/icons';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { MapaidiomaPage } from "../../mapaidioma/mapaidioma.page";
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-asignarmesa',
  templateUrl: './asignarmesa.page.html',
  styleUrls: ['./asignarmesa.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IMPORTS_IONIC, ReactiveFormsModule, MapaidiomaPage]
})
export class AsignarmesaPage implements OnInit {

  formData: FormGroup;
  isLoading: boolean = false;
  mesas: any[] = [];
  clientes: any[] = [];
  clienteSeleccionado: any = null;
  mesaSeleccionada: any = null;
  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);

  constructor(
    private fb: FormBuilder,
    private mesaService: MesaService,
    private clienteService: ClienteService,
    private toastController: ToastController,
    private authService: AuthService,
    private router: Router,
    private notisService: NotificacionesService
  ) {

    addIcons({ logOut, restaurantOutline, arrowBack });
    this.formData = this.fb.group({
      clienteId: [''],
      mesaId: [''],
    });
  }

  ngOnInit() {
    this.cargarMesasDisponibles();
    this.cargarClientesDisponibles();

    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  cargarMesasDisponibles() {

    this.isLoading = true;
    this.mesaService.obtenerMesasDisponibles().then((mesas: any[]) => {
      this.mesas = mesas;
      this.isLoading = false;
    }).catch((error: any) => {
      console.error("Error al cargar mesas:", error);
      this.isLoading = false;
    });
  }

  cargarClientesDisponibles() {

    this.clienteService.obtenerListaEspera().subscribe(clientes => {
      this.clientes = clientes;
      console.log("cliente", this.clientes)
    })
  }

  seleccionarCliente(cliente: any) {
    this.clienteSeleccionado = cliente;
    this.formData.patchValue({ clienteId: cliente.id });
  }

  seleccionarMesa(mesa: any) {
    this.mesaSeleccionada = mesa;
    this.formData.patchValue({ mesaId: mesa.idMesa });
    this.asignarMesa();
  }

  asignarMesa() {

    this.isLoading = true;

    if (!this.formData.value.clienteId) {
      console.log('Error en el id cliente.');
    }

    if (!this.formData.value.mesaId) {
      console.log('Error en el id mesa.');
    }

    if (!this.formData.valid || !this.formData.value.mesaId) {
      console.log('Por favor, selecciona una mesa.');
      return;
    }

    const mesaId = this.formData.value.mesaId;
    const clienteId = this.formData.value.clienteId;

    this.mesaService.asignarMesaACliente(clienteId, mesaId).then(async () => {
      console.log('Mesa asignada con éxito');
      await this.mostrarToast(this.textos[this.currentLang].toasts.mesaAsignada);

      this.clienteSeleccionado = null;
      this.cargarMesasDisponibles();
      this.cargarClientesDisponibles();

      const mesa = await this.mesaService.getMesaPorId(mesaId);

      const t = this.textos[this.currentLang].noti.titulo;
      const body = this.textos[this.currentLang].noti.mensaje.replace('{n}', String(mesa.numero));

      this.notisService.sendNotificationMesaAsignada(t, body, "/local", clienteId);

      this.isLoading = false;

    }).catch((error) => {
      console.error('Error al asignar la mesa:', error);
      this.isLoading = false;
    });


  }

  async mostrarToast(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
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

  textos: any = {
    es: {
      header: 'Asignar Mesa',
      subtituloSeleccion: 'Selecciona un cliente',
      clienteLabel: 'Cliente',
      mesa: 'Mesa',
      personas: { uno: 'persona', muchos: 'personas' },
      listas: {
        clientesTitulo: 'Clientes Disponibles',
        mesasTitulo: 'Mesas'
      },
      botones: {
        cambiarCliente: 'Cambiar cliente'
      },
      toasts: {
        mesaAsignada: 'Mesa asignada con éxito.',
        errorCargarMesas: 'Error al cargar mesas.',
        errorAsignarMesa: 'Error al asignar la mesa.'
      },
      noti: {
        titulo: '🎉 ¡Su mesa está lista!',
        mensaje: 'Mesa #{n} le espera. Por favor, diríjase al salón principal'
      }
    },
    en: {
      header: 'Assign Table',
      subtituloSeleccion: 'Select a customer',
      clienteLabel: 'Customer',
      mesa: 'Table',
      personas: { uno: 'person', muchos: 'people' },
      listas: {
        clientesTitulo: 'Available Customers',
        mesasTitulo: 'Tables'
      },
      botones: {
        cambiarCliente: 'Change customer'
      },
      toasts: {
        mesaAsignada: 'Table assigned successfully.',
        errorCargarMesas: 'Error loading tables.',
        errorAsignarMesa: 'Error assigning the table.'
      },
      noti: {
        titulo: '🎉 Your table is ready!',
        mensaje: 'Table #{n} is waiting for you. Please proceed to the main hall'
      }
    },
    pt: {
      header: 'Atribuir Mesa',
      subtituloSeleccion: 'Selecione um cliente',
      clienteLabel: 'Cliente',
      mesa: 'Mesa',
      personas: { uno: 'pessoa', muchos: 'pessoas' },
      listas: {
        clientesTitulo: 'Clientes Disponíveis',
        mesasTitulo: 'Mesas'
      },
      botones: {
        cambiarCliente: 'Trocar cliente'
      },
      toasts: {
        mesaAsignada: 'Mesa atribuída com sucesso.',
        errorCargarMesas: 'Erro ao carregar mesas.',
        errorAsignarMesa: 'Erro ao atribuir a mesa.'
      },
      noti: {
        titulo: '🎉 Sua mesa está pronta!',
        mensaje: 'Mesa #{n} está à sua espera. Dirija-se ao salão principal'
      }
    },
    fr: {
      header: 'Attribuer une Table',
      subtituloSeleccion: 'Sélectionnez un client',
      clienteLabel: 'Client',
      mesa: 'Table',
      personas: { uno: 'personne', muchos: 'personnes' },
      listas: {
        clientesTitulo: 'Clients Disponibles',
        mesasTitulo: 'Tables'
      },
      botones: {
        cambiarCliente: 'Changer de client'
      },
      toasts: {
        mesaAsignada: 'Table attribuée avec succès.',
        errorCargarMesas: 'Erreur lors du chargement des tables.',
        errorAsignarMesa: 'Erreur lors de l’attribution de la table.'
      },
      noti: {
        titulo: '🎉 Votre table est prête !',
        mensaje: 'La table #{n} vous attend. Veuillez vous diriger vers la salle principale'
      }
    },
    de: {
      header: 'Tisch zuweisen',
      subtituloSeleccion: 'Wähle einen Kunden aus',
      clienteLabel: 'Kunde',
      mesa: 'Tisch',
      personas: { uno: 'Person', muchos: 'Personen' },
      listas: {
        clientesTitulo: 'Verfügbare Kunden',
        mesasTitulo: 'Tische'
      },
      botones: {
        cambiarCliente: 'Kunden wechseln'
      },
      toasts: {
        mesaAsignada: 'Tisch erfolgreich zugewiesen.',
        errorCargarMesas: 'Fehler beim Laden der Tische.',
        errorAsignarMesa: 'Fehler beim Zuweisen des Tisches.'
      },
      noti: {
        titulo: '🎉 Ihr Tisch ist bereit!',
        mensaje: 'Tisch #{n} wartet auf Sie. Bitte begeben Sie sich in den Hauptsaal'
      }
    },
    ru: {
      header: 'Назначить столик',
      subtituloSeleccion: 'Выберите клиента',
      clienteLabel: 'Клиент',
      mesa: 'Стол',
      personas: { uno: 'человек', muchos: 'чел.' },
      listas: {
        clientesTitulo: 'Доступные клиенты',
        mesasTitulo: 'Столики'
      },
      botones: {
        cambiarCliente: 'Сменить клиента'
      },
      toasts: {
        mesaAsignada: 'Столик успешно назначен.',
        errorCargarMesas: 'Ошибка загрузки столиков.',
        errorAsignarMesa: 'Ошибка назначения столика.'
      },
      noti: {
        titulo: '🎉 Ваш столик готов!',
        mensaje: 'Столик #{n} ждёт вас. Просим пройти в главный зал'
      }
    },
    ja: {
      header: 'テーブル割り当て',
      subtituloSeleccion: 'お客様を選択してください',
      clienteLabel: 'お客様',
      mesa: 'テーブル',
      personas: { uno: '名', muchos: '名' },
      listas: {
        clientesTitulo: '利用可能なお客様',
        mesasTitulo: 'テーブル'
      },
      botones: {
        cambiarCliente: 'お客様を変更'
      },
      toasts: {
        mesaAsignada: 'テーブルの割り当てが完了しました。',
        errorCargarMesas: 'テーブルの読み込み中にエラーが発生しました。',
        errorAsignarMesa: 'テーブルの割り当て中にエラーが発生しました。'
      },
      noti: {
        titulo: '🎉 テーブルの準備ができました！',
        mensaje: 'テーブル #{n} でお待ちしています。メインホールへお越しください'
      }
    }
  };

}
