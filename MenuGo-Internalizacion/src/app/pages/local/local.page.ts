import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonButton, ToastController } from '@ionic/angular/standalone';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { ClienteService } from 'src/app/services/cliente.service';
import { Router } from '@angular/router';
import { QrService } from 'src/app/services/qr.service'; // Importamos el servicio QR
import { AuthService } from 'src/app/services/auth.service';
import { register } from 'swiper/element/bundle';
import { addIcons } from 'ionicons';
import { ChatPage } from 'src/app/pages/chat/chat.page';

import { checkmarkCircleOutline, helpCircleOutline, logOut, qrCode, qrCodeOutline, star, timerOutline, chatbubbleEllipsesOutline, closeCircleOutline, restaurant, people, cash, close, gameController, clipboard, receipt, time } from 'ionicons/icons';
import { MesaService } from 'src/app/services/mesa.service';
import { PedidoService } from 'src/app/services/pedido.service';
import { ProductoService } from 'src/app/services/producto.service';
import { collection, Firestore, getDocs, limit, orderBy, query, where } from '@angular/fire/firestore';
import { JuegosService } from 'src/app/services/juegos.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { LanguageService } from 'src/app/services/language.service';
import { MapaidiomaPage } from "../mapaidioma/mapaidioma.page";


// Registrar los componentes de Swiper
register();

@Component({
  selector: 'app-local',
  templateUrl: './local.page.html',
  styleUrls: ['./local.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IMPORTS_IONIC, ChatPage, MapaidiomaPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LocalPage implements OnInit {

  isLoading: boolean = false;
  nombre: string = '';
  foto: string = '';
  qrData: string = '';
  qrCodeUrl: string = '';
  clienteId: string = "";
  userData: any;
  estado: any = "";
  mostrarResumen = false;
  mostrarChat = false;
  animandoCerrar = false;
  pedido: any = [];
  encuestas: any = [];
  colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
  showActionsModal = false;
  realizoEncuesta = false;
  showPropinaModal = false;
  propina: number | null = null;
  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);

  constructor(
    private clienteService: ClienteService,
    private router: Router,
    private authService: AuthService,
    private qrService: QrService,
    private toastController: ToastController,
    private mesaService: MesaService,
    private pedidoService: PedidoService,
    private productoService: ProductoService,
    private firestore: Firestore,
    private juegosService: JuegosService,
    private notisService: NotificacionesService
  ) {
    addIcons({ logOut, star, restaurant, people, cash, qrCode, checkmarkCircleOutline, closeCircleOutline, chatbubbleEllipsesOutline, close, gameController, clipboard, time, receipt });
  }

  formatDate(date: any): string {
    if (!date) return '';

    try {
      // Si es un objeto de Firestore Timestamp
      const jsDate = date.toDate ? date.toDate() : new Date(date);

      return jsDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return '';
    }

  }

  async ngOnInit() {
    this.isLoading = true;
    await addIcons({ star, qrCode, qrCodeOutline, timerOutline, checkmarkCircleOutline, helpCircleOutline, logOut })
    this.userData = await this.authService.getUserData();
    this.estado = this.userData.estado;
    this.clienteId = this.userData.id;

    this.clienteService.obtenerEstadoClienteEnTiempoReal(this.userData.id, (estado: string) => {
      console.log('estado ', estado, 'this.estado ', this.estado);
      if (this.estado != estado) {

        let modifiedUserData = {
          ...this.userData,  // Mantenemos los demás campos intactos
          estado: estado // Modificamos solo el campo "estado" con el nuevo valor
        };

        sessionStorage.setItem('userData', JSON.stringify(modifiedUserData));
        this.estado = estado;
      }
    });

    await this.cargarEncuestas();
    await this.userRealizoEncuesta();

    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
    });

    this.isLoading = false;
  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getRandomColor(): string {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  async iniciarEscaneo() {
    this.isLoading = true;

    // this.spinner = false;
    // this.router.navigate(['/estado-pedido'])
    try {
      const res = await this.qrService.scan(this.userData.id, this.estado);

      if (res?.tipo === 'mesa' && res.resultado) {

        if (this.estado == 'pagando') {
          this.showActionsModal = true;
        } else {

          this.estado = 'en mesa';

          const reservaId = await this.mesaService.obtenerUltimaReserva(this.userData.id);

          // const reservaId = await this.mesaService.obtenerUltimaReserva('zkZbnKgq9oJgx76Fg8NG', '1lyOToQGtMWVrG8WC7ZAtZB1pO63');

          //esto lo hacemos aca para guardar el id de la reserva en el localstorage para despues llamarlo desde mi realizar pedido
          console.log("reservaId", reservaId);

          if (reservaId) {
            this.mesaService.guardarReservaId(reservaId);
          }

          await this.router.navigate(['/realizarpedido']);
        }
      }
      else if (res?.tipo === 'esperando pedido') {
        this.showActionsModal = true;
      }
      else if (res?.tipo === 'propina') {
        const number = this.separarTextoNumero(res?.resultado)
        if (number) {
          this.enviarPropina(number);
        }
        // this.showPropinaModal = true;
      } else if (res?.tipo === 'graficos') {
        this.router.navigate(["/estadisticas"])
      }

    } catch (error: any) {
      console.log("catch");

      const mensaje = error.message || this.textos[this.currentLang].toasts.escanerError;
      console.warn(mensaje);
      await this.mostrarMensaje(mensaje, 'danger');
    } finally {
      console.log("finally");

      this.isLoading = false;
    }
  }

  separarTextoNumero(input: any): number | null {
    // ^(.+?)(\d+)$ → captura todo de forma "no-greedy" hasta el primer dígito, luego todos los dígitos hasta el final
    const match = input.match(/^(.+?)(\d+)$/);
    if (!match) return null;
    const texto = match[1];               // "propina"
    const numero = parseInt(match[2], 10); // 15
    return numero;
  }

  async enviarPropina(propina: number) {
    const reservaId = await this.mesaService.obtenerUltimaReserva(this.clienteId);

    if (!reservaId) {
      console.error('No se encontró una reserva para este cliente');
      return;
    }

    const pedido = await this.pedidoService.getPedidoPorReservaId(reservaId);
    await this.pedidoService.agregarPropina(pedido[0].idPedido, propina);

    this.mostrarMensaje(this.textos[this.currentLang].toasts.propinaOk.replace('{p}', String(propina)));
    this.showPropinaModal = false;
  }

  async mostrarMensaje(mensaje: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2500,
      color,
    });
    await toast.present();
  }

  resenas = [
    {
      nombre: 'Carlos G.',
      iniciales: 'CG',
      color: '#3498db',
      estrellas: 5,
      comentario: 'Excelente servicio y comida deliciosa. Volveré seguro!'
    },
    {
      nombre: 'María L.',
      iniciales: 'ML',
      color: '#e74c3c',
      estrellas: 4,
      comentario: 'Muy buena atención, el lugar es acogedor. Recomendado!'
    },
    {
      nombre: 'Juan P.',
      iniciales: 'JP',
      color: '#2ecc71',
      estrellas: 5,
      comentario: 'La mejor comida de la ciudad, precios justos y buen ambiente.'
    }
  ];

  private estadoIconMap: Record<string, string> = {
    'por escanear': 'qr-code-outline',
    'en lista de espera': 'timer-outline',
    'en mesa': 'checkmark-circle-outline',
    'esperando aprobacion de pedido': 'timer-outline',
    'esperando pedido': 'timer-outline',
    'confirmar entrega': 'help-circle-outline',
    'pedido en mesa': 'checkmark-circle-outline',
    'esperando cuenta': 'timer-outline',
    'pagando': 'checkmark-circle-outline',
    'confirmando pago': 'timer-outline',
    'pago aprobado': 'checkmark-circle-outline',
    'esperando reserva': 'timer-outline',
    'con reserva': 'checkmark-circle-outline',
  };

  getEstadoIcon(estado: string): string {
    return this.estadoIconMap[estado] ?? 'help-circle-outline';
  }

  getClaseEstado(estado: string): string {
    return 'estado-' + estado.trim().toLowerCase().replace(/ /g, '-');
  }

  getEstadoTitulo(estado: string): string {
    return this.textos[this.currentLang].estados[estado]?.titulo
        ?? this.textos[this.currentLang].estados.default.titulo;
  }

  getEstadoDescripcion(estado: string): string {
    return this.textos[this.currentLang].estados[estado]?.desc
        ?? this.textos[this.currentLang].estados.default.desc;
  }

  async confirmarRecepcion() {
    this.isLoading = true;
    await this.clienteService.cambiarEstadoUsuario(this.clienteId, 'pedido en mesa');
    this.isLoading = false;
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



  // getTotal(): number {
  //   // return this.pedido.reduce((acc, item) => acc + (item.cantidad * item.producto.precio), 0);
  // }

  getTotal(): number {
    if (!this.pedido || !this.pedido.resumen) return 0;

    return this.pedido.resumen.reduce((total: number, item: any) => {
      return total + item.cantidad * item.producto.precio;
    }, 0);
  }

  async verResumen() {

    this.isLoading = true;

    this.mostrarResumen = true;

    const reservaId = await this.mesaService.obtenerUltimaReserva(this.clienteId);

    if (!reservaId) {
      console.error('No se encontró una reserva para este cliente');
      return;
    }

    const pedido = await this.pedidoService.getPedidoPorReservaId(reservaId);
    console.log('Pedido recibido:', pedido);

    if (Array.isArray(pedido)) {
      this.pedido = pedido[0];
    } else {
      this.pedido = pedido;
    }

    if (!this.pedido.productos || !Array.isArray(this.pedido.productos)) {
      console.error('El pedido no contiene productos válidos');
      return;
    }

    const productosDetallados = await this.productoService.fetchProductosByIds(this.pedido.productos);
    this.pedido.productosDetallados = productosDetallados;

    const resumen = this.pedido.productos.reduce((acc: any, id: string) => {
      const existente = acc.find((item: any) => item.producto.id === id);

      if (existente) {
        existente.cantidad += 1;
      } else {
        const prodDetallado = productosDetallados.find(p => p.id === id);
        if (prodDetallado) {
          acc.push({ producto: prodDetallado, cantidad: 1 });
        }
      }

      return acc;
    }, []);

    this.pedido.resumen = resumen;

    await this.calcularDescuentos();

    if (this.pedido.propina)
      this.calcularPropina(this.pedido.propina);

    this.isLoading = false;
  }

  calcularPropina(propina: number) {
    this.propina = this.pedido.precioTotal * (propina / 100);
    this.pedido.precioTotal = this.pedido.precioTotal * (propina / 100 + 1);
  }

  async calcularDescuentos() {

    this.pedido.descuentos = [];

    const juegoDescuentos: { [key: string]: number } = {
      "5l6XYagzQD0bR4VLvd2W": 10,  // 10% de descuento para el juego con ID "5l6XYagzQD0bR4VLvd2W"
      "vDBryNGhFmG0785miL5w": 15   // 15% de descuento para el juego con ID "vDBryNGhFmG0785miL5w"
    };

    this.pedido.intentoJuegos.forEach(async (juego: { primerIntento: any; idJuego: string | number; }) => {
      if (juego.primerIntento && juegoDescuentos[juego.idJuego]) {
        const porcentajeDescuento = juegoDescuentos[juego.idJuego];
        const descuentoMonto = (this.pedido.precioTotal * porcentajeDescuento) / 100;
        const nombreJuego = await this.juegosService.traerNombreJuegoPorId(juego.idJuego.toString());

        const mensaje = `Descuento por ganar en primer intento el juego '${nombreJuego}'`;

        // Asignar el descuento en el resumen
        this.pedido.descuentos.push({
          mensaje: mensaje,
          monto: -descuentoMonto
        });

        // Restar el descuento del total
        this.pedido.precioTotal -= descuentoMonto;
      }
    });

  }

  realizarPago() {
    const total = this.pedido.precioTotal;
    console.log("this.total", total);
    sessionStorage.setItem('totalAPagar', total.toString());

    this.mostrarResumen = false;
    this.showActionsModal = false;
    this.router.navigate(['/realizarpago']);
  }


  consultaAMozo() {
    this.mostrarChat = true;
  }

  cerrarChat() {
    this.animandoCerrar = true;
    setTimeout(() => {
      this.mostrarChat = false;
      this.animandoCerrar = false;
    }, 300);
  }


  async cargarEncuestas() {
    try {
      const encuestasRef = collection(this.firestore, 'encuestas');
      const q = query(
        encuestasRef,
        orderBy('date', 'desc'),
        limit(5)
      );

      const querySnapshot = await getDocs(q);
      this.encuestas = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Asegurarse de que tenemos los campos necesarios
        if (data && data["userName"] && data["foodRating"] !== undefined) {
          this.encuestas.push({
            id: doc.id,
            ...data
          });
        }
      });
    } catch (error) {
      console.error('Error al cargar encuestas:', error);
      this.mostrarMensaje(this.textos[this.currentLang].toasts.errorEncuestas, 'danger');
    }
  }

  async userRealizoEncuesta() {
    const reservasRef = collection(this.firestore, 'reservas');
    const q = query(
      reservasRef,
      where('clienteId', '==', this.clienteId),
      orderBy('fechaReserva', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      this.realizoEncuesta = data?.["resena"] ?? false;
    }
  }

  openModal() {
    this.showActionsModal = true;
  }

  closeModal() {
    this.showActionsModal = false;
  }

  goToGames() {
    this.closeModal();
    this.router.navigate(['/menu-juegos'])
    // Navegar a la página de juegos
  }
  closeModalPropina() {
    this.showPropinaModal = false;
  }
  goToSurvey() {
    this.closeModal();
    this.realizoEncuesta = true
    this.router.navigate(['/encuesta'])
    // Navegar a la página de encuestas
  }

  goToOrderStatus() {
    this.closeModal();
    this.router.navigate(['/estado-pedido'])
    // Navegar a la página de estado del pedido
  }

  async requestBill() {
    this.isLoading = true;
    await this.clienteService.cambiarEstadoUsuario(this.clienteId, "esperando cuenta");
    this.closeModal();
    let reserva = await this.mesaService.obtenerReserva(this.clienteId);
    let mesa = await this.mesaService.obtenerMesaPorId(reserva.mesaId);

    const titulo = this.textos[this.currentLang].notis.cuenta.titulo;
    const cuerpo  = this.textos[this.currentLang].notis.cuenta.cuerpo.replace('{n}', String(mesa.numero));
    this.notisService.sendConsultaMozos(titulo, cuerpo, "/panelmozo?cuenta=true");
    this.isLoading = false;
    // Lógica para pedir la cuenta
  }

  cerrarChatSiFuera(event: MouseEvent) {
    // Verificamos si el click ocurrió fuera del modal
    const modalContent = document.querySelector('.modal-contenido-chat');
    if (modalContent && !modalContent.contains(event.target as Node)) {
      // Si el clic fue fuera del contenido, cerramos el chat
      this.cerrarChat();
    }
  }

  hacerReserva() {
    this.router.navigate(['/reservas'])
  }

  verGraficos() {
    this.router.navigate(['/estadisticas'])
  }

  textos: any = {
    es: {
      header: "Menú de Usuario",
      bienvenida: { titulo: "¡Bienvenido al Restaurante!", subtitulo: "Disfrutá de nuestra experiencia" },
      alt: { fotoPerfil: "Foto de perfil" },
      ratings: { comida: "Comida", atencion: "Atención", precio: "Precio" },
      botones: {
        consultaMozo: "Consulta a Mozo",
        hacerReserva: "Hacer Reserva",
        escanearQR: "Escanear Código QR",
        confirmarRecepcion: "Confirmar Recepción"
      },
      cuenta: {
        titulo: "Tu Cuenta",
        cantidad: "Cantidad",
        subtotal: "Subtotal",
        propina: "Propina",
        total: "Total",
        realizarPago: "Realizar Pago",
        cerrar: "Cerrar"
      },
      acciones: {
        titulo: "Acciones Disponibles",
        juegos: "Juegos",
        encuesta: "Encuesta",
        estadisticas: "Estadísticas",
        estadoPedido: "Estado del Pedido",
        pedirCuenta: "Pedir la Cuenta",
        verCuenta: "Ver la Cuenta"
      },
      propina: {
        excelente: "Excelente (20%)",
        muyBueno: "Muy Bueno (15%)",
        bueno: "Bueno (10%)",
        regular: "Regular (5%)",
        malo: "Malo (0%)"
      },
      estados: {
        "aprobado": { titulo: "Escanea para entrar en lista de espera", desc: "Presiona el botón para escanear el código QR y entrar en lista de espera." },
        "en lista de espera": { titulo: "Estás en lista de espera", desc: "Pronto te asignaremos una mesa. Gracias por tu paciencia." },
        "en mesa": { titulo: "Mesa asignada", desc: "Ya podés escanear el Menú en tu mesa. ¡Buen provecho!" },
        "esperando aprobacion de pedido": { titulo: "En espera de aprobación.", desc: "Espera que un mozo apruebe tu pedido." },
        "esperando pedido": { titulo: "En preparación.", desc: "Escanea el código QR para ver el estado de tu pedido." },
        "confirmar entrega": { titulo: "¿Recibió el pedido?", desc: "Por favor confirme la recepción de su pedido." },
        "pedido en mesa": { titulo: "¡Disfrute su comida!", desc: "¡Gracias por elegirnos!" },
        "esperando cuenta": { titulo: "Espere la cuenta...", desc: "En breve le habilitaremos el pago." },
        "pagando": { titulo: "Cuenta Disponible", desc: "Ya puede acceder a su cuenta escaneando el QR." },
        "confirmando pago": { titulo: "Confirmando Pago", desc: "Estamos revisando su pago." },
        "pago aprobado": { titulo: "Pago Aprobado", desc: "Escanea el QR para ver los resultados de las encuestas." },
        "esperando reserva": { titulo: "En espera de aprobación.", desc: "Su reserva debe ser aprobada por un administrador." },
        "con reserva": { titulo: "Reserva confirmada.", desc: "¡Su reserva ha sido confirmada, lo esperamos!" },
        default: { titulo: "Estado desconocido", desc: "Por favor, contacta con el personal." }
      },
      toasts: {
        escanerError: "Error al escanear.",
        propinaOk: "Propina de {p}% enviada con éxito.",
        errorEncuestas: "Error al cargar reseñas"
      },
      notis: {
        cuenta: { titulo: "🧾 Solicitud de cuenta", cuerpo: "Mesa #{n} ha solicitado la cuenta." }
      }
    },

    en: {
      header: "User Menu",
      bienvenida: { titulo: "Welcome to the Restaurant!", subtitulo: "Enjoy our experience" },
      alt: { fotoPerfil: "Profile photo" },
      ratings: { comida: "Food", atencion: "Service", precio: "Price" },
      botones: {
        consultaMozo: "Ask a Waiter",
        hacerReserva: "Make a Reservation",
        escanearQR: "Scan QR Code",
        confirmarRecepcion: "Confirm Delivery"
      },
      cuenta: {
        titulo: "Your Bill",
        cantidad: "Quantity",
        subtotal: "Subtotal",
        propina: "Tip",
        total: "Total",
        realizarPago: "Proceed to Pay",
        cerrar: "Close"
      },
      acciones: {
        titulo: "Available Actions",
        juegos: "Games",
        encuesta: "Survey",
        estadisticas: "Statistics",
        estadoPedido: "Order Status",
        pedirCuenta: "Request Bill",
        verCuenta: "View Bill"
      },
      propina: {
        excelente: "Excellent (20%)",
        muyBueno: "Very Good (15%)",
        bueno: "Good (10%)",
        regular: "Fair (5%)",
        malo: "Poor (0%)"
      },
      estados: {
        "aprobado": { titulo: "Scan to join the waitlist", desc: "Tap the button to scan the QR and join the waitlist." },
        "en lista de espera": { titulo: "You are on the waitlist", desc: "We will assign you a table soon. Thanks for your patience." },
        "en mesa": { titulo: "Table assigned", desc: "You can now scan the menu at your table. Enjoy!" },
        "esperando aprobacion de pedido": { titulo: "Awaiting approval", desc: "Please wait for a waiter to approve your order." },
        "esperando pedido": { titulo: "Being prepared", desc: "Scan the QR code to check your order status." },
        "confirmar entrega": { titulo: "Order received?", desc: "Please confirm you received your order." },
        "pedido en mesa": { titulo: "Enjoy your meal!", desc: "Thanks for choosing us!" },
        "esperando cuenta": { titulo: "Waiting for the bill…", desc: "Payment will be enabled shortly." },
        "pagando": { titulo: "Bill available", desc: "Scan the QR to access your bill." },
        "confirmando pago": { titulo: "Confirming payment", desc: "We are reviewing your payment." },
        "pago aprobado": { titulo: "Payment approved", desc: "Scan the QR to see the survey results." },
        "esperando reserva": { titulo: "Awaiting approval", desc: "Your reservation must be approved by an admin." },
        "con reserva": { titulo: "Reservation confirmed", desc: "Your reservation is confirmed. See you soon!" },
        default: { titulo: "Unknown status", desc: "Please contact the staff." }
      },
      toasts: {
        escanerError: "Scan error.",
        propinaOk: "Tip of {p}% sent successfully.",
        errorEncuestas: "Error loading reviews"
      },
      notis: {
        cuenta: { titulo: "🧾 Bill request", cuerpo: "Table #{n} has requested the bill." }
      }
    },

    pt: {
      header: "Menu do Usuário",
      bienvenida: { titulo: "Bem-vindo ao Restaurante!", subtitulo: "Aproveite a nossa experiência" },
      alt: { fotoPerfil: "Foto de perfil" },
      ratings: { comida: "Comida", atencion: "Atendimento", precio: "Preço" },
      botones: {
        consultaMozo: "Chamar Garçom",
        hacerReserva: "Fazer Reserva",
        escanearQR: "Escanear QR Code",
        confirmarRecepcion: "Confirmar Recebimento"
      },
      cuenta: {
        titulo: "Sua Conta",
        cantidad: "Quantidade",
        subtotal: "Subtotal",
        propina: "Gorjeta",
        total: "Total",
        realizarPago: "Pagar",
        cerrar: "Fechar"
      },
      acciones: {
        titulo: "Ações Disponíveis",
        juegos: "Jogos",
        encuesta: "Pesquisa",
        estadisticas: "Estatísticas",
        estadoPedido: "Status do Pedido",
        pedirCuenta: "Pedir a Conta",
        verCuenta: "Ver a Conta"
      },
      propina: {
        excelente: "Excelente (20%)",
        muyBueno: "Muito Bom (15%)",
        bueno: "Bom (10%)",
        regular: "Regular (5%)",
        malo: "Ruim (0%)"
      },
      estados: {
        "aprobado": { titulo: "Escaneie para entrar na fila", desc: "Toque para escanear o QR e entrar na fila de espera." },
        "en lista de espera": { titulo: "Você está na fila de espera", desc: "Logo vamos atribuir uma mesa. Obrigado pela paciência." },
        "en mesa": { titulo: "Mesa atribuída", desc: "Você já pode escanear o cardápio na sua mesa. Bom apetite!" },
        "esperando aprobacion de pedido": { titulo: "Aguardando aprovação", desc: "Aguarde um garçom aprovar seu pedido." },
        "esperando pedido": { titulo: "Sendo preparado", desc: "Escaneie o QR para ver o status do seu pedido." },
        "confirmar entrega": { titulo: "Pedido recebido?", desc: "Por favor, confirme o recebimento do seu pedido." },
        "pedido en mesa": { titulo: "Aproveite a refeição!", desc: "Obrigado por nos escolher!" },
        "esperando cuenta": { titulo: "Aguardando a conta…", desc: "O pagamento será habilitado em breve." },
        "pagando": { titulo: "Conta disponível", desc: "Escaneie o QR para acessar sua conta." },
        "confirmando pago": { titulo: "Confirmando pagamento", desc: "Estamos revisando seu pagamento." },
        "pago aprobado": { titulo: "Pagamento aprovado", desc: "Escaneie o QR para ver os resultados da pesquisa." },
        "esperando reserva": { titulo: "Aguardando aprovação", desc: "Sua reserva deve ser aprovada por um administrador." },
        "con reserva": { titulo: "Reserva confirmada", desc: "Sua reserva foi confirmada. Esperamos por você!" },
        default: { titulo: "Status desconhecido", desc: "Por favor, contate o pessoal." }
      },
      toasts: {
        escanerError: "Erro ao escanear.",
        propinaOk: "Gorjeta de {p}% enviada com sucesso.",
        errorEncuestas: "Erro ao carregar avaliações"
      },
      notis: {
        cuenta: { titulo: "🧾 Solicitação de conta", cuerpo: "Mesa #{n} solicitou a conta." }
      }
    },

    fr: {
      header: "Menu Utilisateur",
      bienvenida: { titulo: "Bienvenue au Restaurant!", subtitulo: "Profitez de notre expérience" },
      alt: { fotoPerfil: "Photo de profil" },
      ratings: { comida: "Nourriture", atencion: "Service", precio: "Prix" },
      botones: {
        consultaMozo: "Demander un Serveur",
        hacerReserva: "Faire une Réservation",
        escanearQR: "Scanner le QR Code",
        confirmarRecepcion: "Confirmer la Réception"
      },
      cuenta: {
        titulo: "Votre Addition",
        cantidad: "Quantité",
        subtotal: "Sous-total",
        propina: "Pourboire",
        total: "Total",
        realizarPago: "Payer",
        cerrar: "Fermer"
      },
      acciones: {
        titulo: "Actions Disponibles",
        juegos: "Jeux",
        encuesta: "Enquête",
        estadisticas: "Statistiques",
        estadoPedido: "Statut de Commande",
        pedirCuenta: "Demander l’Addition",
        verCuenta: "Voir l’Addition"
      },
      propina: {
        excelente: "Excellent (20%)",
        muyBueno: "Très Bon (15%)",
        bueno: "Bon (10%)",
        regular: "Moyen (5%)",
        malo: "Mauvais (0%)"
      },
      estados: {
        "aprobado": { titulo: "Scannez pour rejoindre la liste d’attente", desc: "Appuyez pour scanner le QR et rejoindre la liste." },
        "en lista de espera": { titulo: "Vous êtes en liste d’attente", desc: "Nous vous attribuerons une table bientôt. Merci de patienter." },
        "en mesa": { titulo: "Table attribuée", desc: "Vous pouvez maintenant scanner le menu à votre table. Bon appétit!" },
        "esperando aprobacion de pedido": { titulo: "En attente d’approbation", desc: "Veuillez attendre qu’un serveur approuve votre commande." },
        "esperando pedido": { titulo: "En préparation", desc: "Scannez le QR pour voir l’état de votre commande." },
        "confirmar entrega": { titulo: "Commande reçue?", desc: "Veuillez confirmer la réception de votre commande." },
        "pedido en mesa": { titulo: "Bon appétit!", desc: "Merci de nous avoir choisis!" },
        "esperando cuenta": { titulo: "En attente de l’addition…", desc: "Le paiement sera activé sous peu." },
        "pagando": { titulo: "Addition disponible", desc: "Scannez le QR pour accéder à votre addition." },
        "confirmando pago": { titulo: "Confirmation du paiement", desc: "Nous vérifions votre paiement." },
        "pago aprobado": { titulo: "Paiement approuvé", desc: "Scannez le QR pour voir les résultats des enquêtes." },
        "esperando reserva": { titulo: "En attente d’approbation", desc: "Votre réservation doit être approuvée par un administrateur." },
        "con reserva": { titulo: "Réservation confirmée", desc: "Votre réservation est confirmée. À bientôt!" },
        default: { titulo: "Statut inconnu", desc: "Veuillez contacter le personnel." }
      },
      toasts: {
        escanerError: "Erreur de scan.",
        propinaOk: "Pourboire de {p}% envoyé avec succès.",
        errorEncuestas: "Erreur de chargement des avis"
      },
      notis: {
        cuenta: { titulo: "🧾 Demande d’addition", cuerpo: "Table #{n} a demandé l’addition." }
      }
    },

    de: {
      header: "Benutzermenü",
      bienvenida: { titulo: "Willkommen im Restaurant!", subtitulo: "Genießen Sie unsere Erfahrung" },
      alt: { fotoPerfil: "Profilfoto" },
      ratings: { comida: "Essen", atencion: "Service", precio: "Preis" },
      botones: {
        consultaMozo: "Kellner rufen",
        hacerReserva: "Reservierung machen",
        escanearQR: "QR-Code scannen",
        confirmarRecepcion: "Lieferung bestätigen"
      },
      cuenta: {
        titulo: "Ihre Rechnung",
        cantidad: "Menge",
        subtotal: "Zwischensumme",
        propina: "Trinkgeld",
        total: "Gesamt",
        realizarPago: "Bezahlen",
        cerrar: "Schließen"
      },
      acciones: {
        titulo: "Verfügbare Aktionen",
        juegos: "Spiele",
        encuesta: "Umfrage",
        estadisticas: "Statistiken",
        estadoPedido: "Bestellstatus",
        pedirCuenta: "Rechnung anfordern",
        verCuenta: "Rechnung ansehen"
      },
      propina: {
        excelente: "Ausgezeichnet (20%)",
        muyBueno: "Sehr gut (15%)",
        bueno: "Gut (10%)",
        regular: "Mittel (5%)",
        malo: "Schlecht (0%)"
      },
      estados: {
        "aprobado": { titulo: "Scannen, um der Warteliste beizutreten", desc: "Tippen Sie auf die Schaltfläche, um den QR zu scannen." },
        "en lista de espera": { titulo: "Sie stehen auf der Warteliste", desc: "Wir werden Ihnen bald einen Tisch zuweisen." },
        "en mesa": { titulo: "Tisch zugewiesen", desc: "Sie können nun die Speisekarte am Tisch scannen. Guten Appetit!" },
        "esperando aprobacion de pedido": { titulo: "Warten auf Genehmigung", desc: "Bitte warten, bis ein Kellner Ihre Bestellung genehmigt." },
        "esperando pedido": { titulo: "In Vorbereitung", desc: "Scannen Sie den QR, um den Bestellstatus zu sehen." },
        "confirmar entrega": { titulo: "Bestellung erhalten?", desc: "Bitte bestätigen Sie den Erhalt Ihrer Bestellung." },
        "pedido en mesa": { titulo: "Guten Appetit!", desc: "Danke, dass Sie uns gewählt haben!" },
        "esperando cuenta": { titulo: "Warten auf die Rechnung…", desc: "Die Zahlung wird in Kürze aktiviert." },
        "pagando": { titulo: "Rechnung verfügbar", desc: "Scannen Sie den QR, um Ihre Rechnung zu sehen." },
        "confirmando pago": { titulo: "Zahlung bestätigen", desc: "Wir überprüfen Ihre Zahlung." },
        "pago aprobado": { titulo: "Zahlung genehmigt", desc: "Scannen Sie den QR, um die Umfrageergebnisse zu sehen." },
        "esperando reserva": { titulo: "Warten auf Genehmigung", desc: "Ihre Reservierung muss genehmigt werden." },
        "con reserva": { titulo: "Reservierung bestätigt", desc: "Ihre Reservierung wurde bestätigt. Willkommen!" },
        default: { titulo: "Unbekannter Status", desc: "Bitte wenden Sie sich an das Personal." }
      },
      toasts: {
        escanerError: "Scan-Fehler.",
        propinaOk: "Trinkgeld von {p}% erfolgreich gesendet.",
        errorEncuestas: "Fehler beim Laden der Bewertungen"
      },
      notis: {
        cuenta: { titulo: "🧾 Rechnungsanforderung", cuerpo: "Tisch #{n} hat die Rechnung angefordert." }
      }
    },

    ru: {
      header: "Меню пользователя",
      bienvenida: { titulo: "Добро пожаловать в ресторан!", subtitulo: "Наслаждайтесь нашим сервисом" },
      alt: { fotoPerfil: "Фото профиля" },
      ratings: { comida: "Еда", atencion: "Сервис", precio: "Цена" },
      botones: {
        consultaMozo: "Позвать официанта",
        hacerReserva: "Сделать бронирование",
        escanearQR: "Сканировать QR-код",
        confirmarRecepcion: "Подтвердить получение"
      },
      cuenta: {
        titulo: "Ваш счет",
        cantidad: "Количество",
        subtotal: "Промежуточный итог",
        propina: "Чаевые",
        total: "Итого",
        realizarPago: "Оплатить",
        cerrar: "Закрыть"
      },
      acciones: {
        titulo: "Доступные действия",
        juegos: "Игры",
        encuesta: "Опрос",
        estadisticas: "Статистика",
        estadoPedido: "Статус заказа",
        pedirCuenta: "Попросить счет",
        verCuenta: "Посмотреть счет"
      },
      propina: {
        excelente: "Отлично (20%)",
        muyBueno: "Очень хорошо (15%)",
        bueno: "Хорошо (10%)",
        regular: "Средне (5%)",
        malo: "Плохо (0%)"
      },
      estados: {
        "aprobado": { titulo: "Сканируйте, чтобы попасть в список ожидания", desc: "Нажмите кнопку, чтобы сканировать QR." },
        "en lista de espera": { titulo: "Вы в списке ожидания", desc: "Скоро мы предоставим вам столик. Спасибо за ожидание." },
        "en mesa": { titulo: "Столик назначен", desc: "Теперь вы можете сканировать меню за своим столом. Приятного аппетита!" },
        "esperando aprobacion de pedido": { titulo: "Ожидается подтверждение", desc: "Подождите, пока официант подтвердит заказ." },
        "esperando pedido": { titulo: "Готовится", desc: "Сканируйте QR, чтобы проверить статус заказа." },
        "confirmar entrega": { titulo: "Заказ получен?", desc: "Пожалуйста, подтвердите получение заказа." },
        "pedido en mesa": { titulo: "Приятного аппетита!", desc: "Спасибо, что выбрали нас!" },
        "esperando cuenta": { titulo: "Ожидание счета…", desc: "Оплата будет доступна скоро." },
        "pagando": { titulo: "Счет доступен", desc: "Сканируйте QR, чтобы увидеть счет." },
        "confirmando pago": { titulo: "Подтверждение оплаты", desc: "Мы проверяем ваш платеж." },
        "pago aprobado": { titulo: "Оплата подтверждена", desc: "Сканируйте QR, чтобы увидеть результаты опросов." },
        "esperando reserva": { titulo: "Ожидается подтверждение", desc: "Ваше бронирование должно быть одобрено администратором." },
        "con reserva": { titulo: "Бронирование подтверждено", desc: "Ваше бронирование подтверждено. Ждем вас!" },
        default: { titulo: "Неизвестный статус", desc: "Пожалуйста, обратитесь к персоналу." }
      },
      toasts: {
        escanerError: "Ошибка сканирования.",
        propinaOk: "Чаевые {p}% успешно отправлены.",
        errorEncuestas: "Ошибка загрузки отзывов"
      },
      notis: {
        cuenta: { titulo: "🧾 Запрос счета", cuerpo: "Стол #{n} запросил счет." }
      }
    },

    ja: {
      header: "ユーザーメニュー",
      bienvenida: { titulo: "レストランへようこそ！", subtitulo: "私たちの体験をお楽しみください" },
      alt: { fotoPerfil: "プロフィール写真" },
      ratings: { comida: "料理", atencion: "サービス", precio: "価格" },
      botones: {
        consultaMozo: "ウェイターに相談",
        hacerReserva: "予約する",
        escanearQR: "QRコードをスキャン",
        confirmarRecepcion: "受け取りを確認"
      },
      cuenta: {
        titulo: "お会計",
        cantidad: "数量",
        subtotal: "小計",
        propina: "チップ",
        total: "合計",
        realizarPago: "支払う",
        cerrar: "閉じる"
      },
      acciones: {
        titulo: "利用可能な操作",
        juegos: "ゲーム",
        encuesta: "アンケート",
        estadisticas: "統計",
        estadoPedido: "注文状況",
        pedirCuenta: "会計を依頼",
        verCuenta: "会計を見る"
      },
      propina: {
        excelente: "素晴らしい (20%)",
        muyBueno: "とても良い (15%)",
        bueno: "良い (10%)",
        regular: "普通 (5%)",
        malo: "悪い (0%)"
      },
      estados: {
        "aprobado": { titulo: "スキャンして順番待ちに参加", desc: "ボタンを押してQRをスキャンしてください。" },
        "en lista de espera": { titulo: "順番待ち中です", desc: "まもなくテーブルをご案内します。お待ちいただきありがとうございます。" },
        "en mesa": { titulo: "テーブルが割り当てられました", desc: "テーブルでメニューをスキャンできます。どうぞ召し上がれ！" },
        "esperando aprobacion de pedido": { titulo: "承認待ち", desc: "スタッフが注文を承認するまでお待ちください。" },
        "esperando pedido": { titulo: "準備中", desc: "QRコードをスキャンして注文状況を確認してください。" },
        "confirmar entrega": { titulo: "注文を受け取りましたか？", desc: "受け取りを確認してください。" },
        "pedido en mesa": { titulo: "お食事をお楽しみください！", desc: "ご利用いただきありがとうございます！" },
        "esperando cuenta": { titulo: "会計待ち…", desc: "まもなく支払い可能になります。" },
        "pagando": { titulo: "会計利用可能", desc: "QRコードをスキャンして会計を確認してください。" },
        "confirmando pago": { titulo: "支払い確認中", desc: "支払いを確認しています。" },
        "pago aprobado": { titulo: "支払い承認済み", desc: "QRコードをスキャンしてアンケート結果をご覧ください。" },
        "esperando reserva": { titulo: "承認待ち", desc: "予約は管理者による承認が必要です。" },
        "con reserva": { titulo: "予約確認済み", desc: "予約が確認されました。お待ちしています！" },
        default: { titulo: "不明な状態", desc: "スタッフにお問い合わせください。" }
      },
      toasts: {
        escanerError: "スキャンエラー。",
        propinaOk: "{p}% のチップを送信しました。",
        errorEncuestas: "レビューの読み込みエラー"
      },
      notis: {
        cuenta: { titulo: "🧾 会計のリクエスト", cuerpo: "テーブル #{n} が会計を依頼しました。" }
      }
    }
  };

}