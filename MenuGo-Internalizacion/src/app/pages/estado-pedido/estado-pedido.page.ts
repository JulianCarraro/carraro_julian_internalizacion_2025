import { Component, OnInit, OnDestroy, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { AuthService } from 'src/app/services/auth.service';
import { PedidoService } from 'src/app/services/pedido.service';
import { TareaService } from 'src/app/services/tarea.service';
import { ProductoService } from 'src/app/services/producto.service';
import { Firestore, Timestamp, collection, doc } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { addIcons } from 'ionicons';
import { refresh, warning, restaurant, documentText, time, checkmarkCircle, timeOutline } from 'ionicons/icons';
import { onSnapshot } from 'firebase/firestore';
import { MapaidiomaPage } from "../mapaidioma/mapaidioma.page";
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-estado-pedido',
  templateUrl: './estado-pedido.page.html',
  styleUrls: ['./estado-pedido.page.scss'],
  standalone: true,
  imports: [IMPORTS_IONIC, CommonModule, MapaidiomaPage]
})
export class EstadoPedidoPage implements OnInit, OnDestroy {
  userData: any;
  reservaActual: any;
  pedidoActual: any;
  tareas: any[] = [];
  productos: any[] = [];
  isLoading = true;
  errorMessage = '';
  progressPercentage = 1;
  estimatedTime = 0;
  private pedidoSubscription!: () => void;
  private tareasSubscription!: () => void;
  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);

  constructor(
    private authService: AuthService,
    private pedidoService: PedidoService,
    private tareaService: TareaService,
    private productoService: ProductoService,
    private firestore: Firestore,
    private ngZone: NgZone // Inyectamos NgZone
  ) {
    addIcons({ warning, refresh, restaurant, documentText, time, checkmarkCircle, timeOutline });
  }

  async ngOnInit() {
    this.isLoading = true;
    try {
      this.userData = this.authService.getUserData();
      if (!this.userData) {
        this.errorMessage = this.textos[this.currentLang].error.unauth;
        // this.isLoading = false;
        return;
      }

      await this.cargarReservaActual();
      if (this.reservaActual) {
        await this.cargarPedidoActual();
        this.suscribirCambiosPedido();
      } else {
        this.errorMessage = this.textos[this.currentLang].error.noReserva;
        // this.isLoading = false;
      }
    } catch (error) {
      console.error('Error inicializando:', error);
      this.errorMessage = this.textos[this.currentLang].error.generic;
      // this.isLoading = false;
    } finally {
      this.isLoading = false;
    }
  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  ngOnDestroy() {
    this.pedidoSubscription?.();
    this.tareasSubscription?.();
  }

  private async cargarReservaActual() {
    try {
      const reservasRef = collection(this.firestore, 'reservas');
      const q = query(
        reservasRef,
        where('clienteId', '==', this.userData.id),
        where('estado', '==', 'activa'),
        orderBy('fechaReserva', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        this.reservaActual = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        };
      }
    } catch (error) {
      console.error('Error cargando reserva:', error);
      throw error;
    }
  }

  private async cargarPedidoActual() {
    try {
      const pedidosRef = collection(this.firestore, 'pedidos');
      const q = query(
        pedidosRef,
        where('reservaId', '==', this.reservaActual.id),
        orderBy('creadoEn', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        this.pedidoActual = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        };
        await this.cargarTareasYProductos();
        this.calcularProgreso();
      } else {
        this.errorMessage = this.textos[this.currentLang].error.noPedido;
      }
    } catch (error) {
      console.error('Error cargando pedido:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  private async cargarTareasYProductos() {
    try {
      // Obtener tareas del pedido
      const tareas = await this.tareaService.getTareasPorPedido(this.pedidoActual.idPedido);

      // Obtener IDs de productos únicos
      const productIds = [...new Set(tareas.map(t => t.idProducto))];

      // Obtener detalles de productos
      const productos = await this.productoService.fetchProductosByIds(productIds);

      // Combinar tareas con detalles de productos
      this.tareas = tareas.map(tarea => {
        const producto = productos.find(p => p.id === tarea.idProducto);
        return {
          ...tarea,
          producto: producto || null,
          tiempoRestante: this.calcularTiempoRestante(tarea)
        };
      });
    } catch (error) {
      console.error('Error cargando tareas y productos:', error);
      throw error;
    }
  }

  private calcularTiempoRestante(tarea: any): number {
    if (!tarea.tiempoEstimado) return 0;

    // Si es un Timestamp de Firebase
    if (tarea.tiempoEstimado instanceof Timestamp) {
      const tiempoEstimadoMs = tarea.tiempoEstimado.toDate().getTime();
      const ahora = Date.now();
      return Math.max(0, Math.ceil((tiempoEstimadoMs - ahora) / 60000));
    }

    // Si ya es un número (en milisegundos)
    if (typeof tarea.tiempoEstimado === 'number') {
      return Math.max(0, Math.ceil((tarea.tiempoEstimado - Date.now()) / 60000));
    }

    return 0;
  }

  private calcularProgreso() {

    const total = this.tareas.length;
    if (total === 0) {
      this.progressPercentage = 0;
      return;
    }


    const completadas = this.tareas.filter(t => t.estado === 'listo para servir').length;
    const enPrep = this.tareas.filter(t => t.estado === 'en preparacion').length;
    const pesoPrep = 0.5;  // cada “en preparación” vale medio punto

    // suma de “avances”
    const avance = completadas + enPrep * pesoPrep;

    // porcentaje entero 0–100
    this.progressPercentage = Math.round((avance / total) * 100);

    if (this.progressPercentage <= 10) {
      this.progressPercentage = 10;
    } else if (enPrep >= 1 && this.progressPercentage < 34) {
      this.progressPercentage = 34;
    }

    if (!this.pedidoActual?.tiempoEstimado || !this.pedidoActual?.creadoEn || this.progressPercentage == 100) {
      this.estimatedTime = 0;
      return;
    }

    // 1. Convertir creadoEn a Date si es Timestamp
    let creadoDate: Date;
    const creado = this.pedidoActual.creadoEn;
    if (creado instanceof Timestamp) {
      creadoDate = creado.toDate();
    } else {
      creadoDate = new Date(creado);
    }

    // 2. Minutos transcurridos
    const minutosPasados = (Date.now() - creadoDate.getTime()) / 60000;

    // 3. Restar del tiempo estimado
    const restante = this.pedidoActual.tiempoEstimado - minutosPasados;

    // 4. No caer bajo cero y redondear
    this.estimatedTime = Math.max(0, Math.ceil(restante));

    if (this.progressPercentage == 100)
      this.progressPercentage = 0;
  }

  private suscribirCambiosPedido() {
    if (!this.pedidoActual) return;

    const pedidoRef = doc(this.firestore, `pedidos/${this.pedidoActual.id}`);

    // Usamos NgZone.run para ejecutar dentro del contexto de Angular
    this.pedidoSubscription = onSnapshot(pedidoRef, (docSnapshot) => {
      this.ngZone.run(() => {
        this.isLoading = true;
        if (docSnapshot.exists()) {
          this.pedidoActual = {
            id: docSnapshot.id,
            ...docSnapshot.data()
          };
        }
        this.isLoading = false;
      });
    });

    const tareasRef = collection(this.firestore, 'tareas');
    const q = query(tareasRef, where('idPedido', '==', this.pedidoActual.idPedido));

    this.tareasSubscription = onSnapshot(q, (querySnapshot) => {
      this.ngZone.run(() => {
        this.tareas = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        this.cargarTareasYProductos();
        this.calcularProgreso();
      });
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'listo para servir': return 'success';
      case 'en preparacion': return 'warning';
      case 'pendiente': return 'danger';
      // si tu pedido usa otros valores, añádelos aquí
      default: return 'medium';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'listo para servir': return this.textos[this.currentLang].statuses.listo;
      case 'en preparacion':   return this.textos[this.currentLang].statuses.enPrep;
      case 'pendiente':        return this.textos[this.currentLang].statuses.pendiente;
      default:                 return this.textos[this.currentLang].statuses.desconocido;
    }
  }


  contactStaff() {
    console.log('Contactando al personal...');
    // Lógica para contactar al personal
  }

  textos: any = {
    es: {
      header: "Seguimiento de Pedido",
      loading: { text: "Cargando información de tu pedido..." },
      error: {
        unauth: "Usuario no autenticado",
        noReserva: "No tienes una reserva activa",
        noPedido: "No se encontró un pedido para tu reserva",
        generic: "Error al cargar los datos",
        retry: "Reintentar"
      },
      order: {
        title: "Pedido",
        steps: { recibido: "Recibido", preparando: "Preparando", listo: "Listo" },
        time: { title: "Tiempo estimado", minutes: "minutos" },
        details: { title: "Detalles del pedido", loadingItem: "Cargando..." }
      },
      statuses: {
        listo: "Listo",
        enPrep: "En preparación",
        pendiente: "Pendiente",
        desconocido: "Desconocido"
      }
    },
    en: {
      header: "Order Tracking",
      loading: { text: "Loading your order information..." },
      error: {
        unauth: "User not authenticated",
        noReserva: "You don't have an active reservation",
        noPedido: "No order found for your reservation",
        generic: "Error loading data",
        retry: "Retry"
      },
      order: {
        title: "Order",
        steps: { recibido: "Received", preparando: "Preparing", listo: "Ready" },
        time: { title: "Estimated time", minutes: "minutes" },
        details: { title: "Order details", loadingItem: "Loading..." }
      },
      statuses: {
        listo: "Ready",
        enPrep: "Preparing",
        pendiente: "Pending",
        desconocido: "Unknown"
      }
    },
    pt: {
      header: "Acompanhamento do Pedido",
      loading: { text: "Carregando informações do seu pedido..." },
      error: {
        unauth: "Usuário não autenticado",
        noReserva: "Você não tem uma reserva ativa",
        noPedido: "Nenhum pedido encontrado para sua reserva",
        generic: "Erro ao carregar dados",
        retry: "Tentar novamente"
      },
      order: {
        title: "Pedido",
        steps: { recibido: "Recebido", preparando: "Preparando", listo: "Pronto" },
        time: { title: "Tempo estimado", minutes: "minutos" },
        details: { title: "Detalhes do pedido", loadingItem: "Carregando..." }
      },
      statuses: {
        listo: "Pronto",
        enPrep: "Preparando",
        pendiente: "Pendente",
        desconocido: "Desconhecido"
      }
    },
    fr: {
      header: "Suivi de Commande",
      loading: { text: "Chargement des informations de votre commande..." },
      error: {
        unauth: "Utilisateur non authentifié",
        noReserva: "Vous n'avez pas de réservation active",
        noPedido: "Aucune commande trouvée pour votre réservation",
        generic: "Erreur de chargement des données",
        retry: "Réessayer"
      },
      order: {
        title: "Commande",
        steps: { recibido: "Reçue", preparando: "Préparation", listo: "Prête" },
        time: { title: "Temps estimé", minutes: "minutes" },
        details: { title: "Détails de la commande", loadingItem: "Chargement..." }
      },
      statuses: {
        listo: "Prête",
        enPrep: "Préparation",
        pendiente: "En attente",
        desconocido: "Inconnu"
      }
    },
    de: {
      header: "Bestellverfolgung",
      loading: { text: "Bestellinformationen werden geladen..." },
      error: {
        unauth: "Benutzer nicht angemeldet",
        noReserva: "Sie haben keine aktive Reservierung",
        noPedido: "Keine Bestellung für Ihre Reservierung gefunden",
        generic: "Fehler beim Laden der Daten",
        retry: "Erneut versuchen"
      },
      order: {
        title: "Bestellung",
        steps: { recibido: "Eingegangen", preparando: "In Bearbeitung", listo: "Fertig" },
        time: { title: "Geschätzte Zeit", minutes: "Minuten" },
        details: { title: "Bestelldetails", loadingItem: "Wird geladen..." }
      },
      statuses: {
        listo: "Fertig",
        enPrep: "In Bearbeitung",
        pendiente: "Ausstehend",
        desconocido: "Unbekannt"
      }
    }
  };
}