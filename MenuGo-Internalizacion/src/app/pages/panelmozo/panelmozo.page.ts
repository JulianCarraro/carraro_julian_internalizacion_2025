import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBadge, IonSegment } from '@ionic/angular/standalone';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { Subscription } from 'rxjs';
import { PedidoService } from 'src/app/services/pedido.service';
import {
  checkmarkOutline, closeOutline, chatbubbleEllipsesOutline, checkmarkDoneOutline, chevronBackOutline, timeOutline,
  chevronForwardOutline, closeCircleOutline, checkmarkDoneCircleOutline, logOut, cashOutline, restaurantOutline
} from 'ionicons/icons';
import { TareaService } from 'src/app/services/tarea.service';
import { MesaService } from 'src/app/services/mesa.service';
import { ReservaService } from 'src/app/services/reserva.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { LanguageService } from 'src/app/services/language.service';
import { MapaidiomaPage } from "../mapaidioma/mapaidioma.page";

@Component({
  selector: 'app-panelmozo',
  templateUrl: './panelmozo.page.html',
  styleUrls: ['./panelmozo.page.scss'],
  standalone: true,
  imports: [IonSegment, IonBadge, CommonModule, FormsModule, IMPORTS_IONIC, MapaidiomaPage]
})
export class PanelmozoPage implements OnInit {

  isLoading: boolean = false;
  isModalOpen: boolean = false;
  pedidos: any[] = [];
  mensajesSub!: Subscription;
  consultaIndex: number = 0;
  estadoSeleccionado: string = 'pendiente_aprobacion';
  cuentaSeleccionada: string = 'esperando cuenta';
  mostrarConsultas: boolean = false;
  respuestaAbierta: boolean = false;
  respuesta: string = '';
  checkIcon = checkmarkOutline;
  closeIcon = closeOutline;
  userData: any;
  pantallaActual: 'pedidos' | 'cuentas' = 'pedidos';
  cuentas: any[] = [];
  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);

  consultas: any

  constructor(private pedidoService: PedidoService, private tareaService: TareaService,
    private mesaService: MesaService, private reservaService: ReservaService,
    private clienteService: ClienteService, private authService: AuthService, private cdr: ChangeDetectorRef, private router: Router, private route: ActivatedRoute,
    private toastController: ToastController, private notiService: NotificacionesService) {

    addIcons({ logOut, chevronBackOutline, timeOutline, chatbubbleEllipsesOutline, chevronForwardOutline, closeCircleOutline, checkmarkDoneCircleOutline, cashOutline, restaurantOutline });
  }

  ngOnInit() {
    this.isLoading = true;

    const qs = this.route.snapshot.queryParamMap.get('cuenta');


    this.userData = this.authService.getUserData();
    this.pedidoService.obtenerPedidosEnTiempoReal().subscribe(async pedidos => {
      this.pedidos = pedidos;
      console.log("pedidos", this.pedidos);

      for (const pedido of this.pedidos) {
        try {
          const reserva = await this.reservaService.getReservaPorId(pedido.reservaId);
          const mesa = await this.mesaService.getMesaPorId(reserva.mesaId);
          pedido.nroDeMesa = mesa?.numero || 'sin número';
        } catch (error) {
          console.error('Error obteniendo número de mesa:', error);
          pedido.nroDeMesa = 'sin número';
        }

        this.tareaService.getTareasPorPedidoEnTiempoReal(pedido.idPedido)
          .subscribe(tareas => {
            for (const prod of pedido.productosDetallados) {
              const tarea = tareas.find(t => t.idProducto === prod.id);
              prod.estadoTarea = tarea?.estado || 'sin estado';
            }
          });
      }
      if (qs == 'true') {
        this.cambiarPantalla();
      }

      this.isLoading = false;


    });

    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
    });

    this.mensajesSub = this.clienteService.getConsultasPendientesRealtime()
      .subscribe(consultas => {
        this.consultas = consultas;
        console.log("consultas actualizadas en tiempo real", consultas);
        this.cdr.detectChanges();
      });

    this.obtenerCuentasConMesa();

  }

  ngOnDestroy() {
    this.mensajesSub.unsubscribe();
  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }


  getProductosAgrupados(productos: any[]): { descripcion: string, cantidad: number, estadoTarea: string }[] {
    const mapa = new Map<string, { descripcion: string; cantidad: number; estadoTarea: string }>();

    for (const prod of productos) {
      const clave = prod.descripcion;
      if (mapa.has(clave)) {
        mapa.get(clave)!.cantidad++;
      } else {
        mapa.set(clave, { descripcion: prod.descripcion, cantidad: 1, estadoTarea: prod.estadoTarea });
      }
    }

    return Array.from(mapa.values());
  }

  toggleConsultas() {
    this.mostrarConsultas = !this.mostrarConsultas;
    this.respuestaAbierta = false;
    this.respuesta = '';
    this.consultaIndex = 0;
  }

  abrirRespuesta() {
    this.respuestaAbierta = true;
  }

  async enviarRespuesta() {
    if (this.respuesta.trim() === '') return;

    const consulta = this.consultas[this.consultaIndex];

    try {
      await this.clienteService.responderMensajeMozo(
        consulta.clienteId,
        this.respuesta,
        this.userData.nombre
      );

      this.consultas.splice(this.consultaIndex, 1);
      this.respuesta = '';
      this.respuestaAbierta = false;
      this.toggleConsultas();

      if (this.consultaIndex >= this.consultas.length) {
        this.consultaIndex = Math.max(0, this.consultas.length - 1);
      }

    } catch (error) {
      console.error('Error al enviar respuesta:', error);
    }
  }

  prevConsulta() {
    if (this.consultaIndex > 0) {
      this.consultaIndex--;
      this.respuestaAbierta = false;
      this.respuesta = '';
    }
  }

  nextConsulta() {
    if (this.consultaIndex < this.consultas.length - 1) {
      this.consultaIndex++;
      this.respuestaAbierta = false;
      this.respuesta = '';
    }
  }

  async aceptarPedido(pedidoId: string) {
    try {
      this.isLoading = true;
      await this.pedidoService.confirmarPedido(pedidoId);
      this.notiService.sendNotificationToSectores("Nuevas tareas pendientes", `Hay nuevas comandas disponibles.`, "");
      console.log(`Pedido ${pedidoId} confirmado`);
    } catch (error) {
      console.error('Error al confirmar pedido:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async rechazarPedido(pedidoId: string) {
    try {
      this.isLoading = true;
      await this.pedidoService.rechazarPedido(pedidoId);
      console.log(`Pedido ${pedidoId} rechazado`);
    } catch (error) {
      console.error('Error al rechazar pedido:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async entregarPedido(pedidoId: string) {
    try {
      this.isLoading = true;
      await this.pedidoService.entregarPedido(pedidoId);
      console.log(`Pedido ${pedidoId} entregado`);
    } catch (error) {
      console.error('Error al confirmar pedido:', error);
    } finally {
      this.isLoading = false;
    }
  }

  pedidosFiltrados() {
    if (this.estadoSeleccionado === 'todos') {
      return this.pedidos;
    }
    return this.pedidos.filter(p => p.estado === this.estadoSeleccionado);
  }

  onCategoriaChange(event: any) {
    this.estadoSeleccionado = event.detail.value;
  }

  onCuentaChange(event: any) {
    this.cuentaSeleccionada = event.detail.value;
    console.log("cuentachange", this.cuentaSeleccionada)
  }

  cuentasFiltradas() {
    if (this.cuentaSeleccionada === 'todos') {
      return this.cuentas;
    }
    return this.cuentas.filter(p => p.estado === this.cuentaSeleccionada);
  }



  getColor(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'warning';
      case 'en preparacion': return 'primary';
      case 'listo para servir': return 'success';
      default: return 'medium';
    }
  }

  cambiarPantalla() {
    this.pantallaActual = this.pantallaActual === 'pedidos' ? 'cuentas' : 'pedidos';
  }

  async obtenerCuentasConMesa() {
    try {
      this.clienteService.obtenerClientesPidiendoCuenta().subscribe(async (clientes) => {
        for (const cliente of clientes) {
          try {
            const reserva = await this.reservaService.getReservaPorIdCliente(cliente.id);
            if (reserva) {
              console.log("reserva", reserva);
              const mesa = await this.mesaService.getMesaPorId(reserva.mesaId);
              const pedido = await this.pedidoService.getPedidoPorReservaId(reserva.id);
              console.log("pedido", pedido);
              cliente.nroDeMesa = mesa?.numero || 'Sin número';
              cliente.pedido = pedido;
            } else {
              cliente.nroDeMesa = 'No tiene reserva activa';
            }
          } catch (error) {
            console.error('Error al obtener datos de la reserva o mesa:', error);
            cliente.nroDeMesa = 'Error al cargar mesa';
          }
        }

        this.cuentas = clientes;
        console.log("Cuentas actualizadas con mesa:", this.cuentas);
      });
    } catch (error) {
      console.error('Error al obtener cuentas:', error);
    }
  }


  confirmarCuentaACliente(id: string) {
    this.isLoading = true;
    this.clienteService.cambiarEstadoUsuario(id, 'pagando').then(() => {
      this.presentToast(this.textos[this.currentLang].toasts.cuentaConfirmada, 'success');
    }).catch(error => {
      this.presentToast(this.textos[this.currentLang].toasts.errorConfirmarCuenta, 'danger');
    }).finally(() => {
      this.isLoading = false;
    });;
  }

  private async presentToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      color
    });
    toast.present();
  }

  async confirmarPago(clienteId: string) {
    this.isLoading = true;
    this.clienteService.cambiarEstadoUsuario(clienteId, 'pago aprobado').then(async () => {

      const reserva = await this.reservaService.getReservaPorIdCliente(clienteId);

      await this.pedidoService.cerrarPedidoPorReservaId(reserva);

      this.presentToast(this.textos[this.currentLang].toasts.pagoConfirmado, 'success');
    }).catch(error => {
      this.presentToast(this.textos[this.currentLang].toasts.errorConfirmarPago, 'danger');
    }).finally(() => {
      this.isLoading = false;
    });
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
      header: { pedidos: 'Pedidos', cuentas: 'Cuentas' },
      segmentosPedidos: {
        pendiente: 'Pendiente',
        enPrep: 'En preparación',
        completado: 'Completado'
      },
      tarjetaPedido: {
        mesa: 'Mesa',
        productos_uno: 'producto',
        productos_muchos: 'productos',
        total: 'Total',
        estados: {
          pendiente: '🕒 Pendiente',
          enPrep: '👨‍🍳 En preparación',
          listo: '✅ Listo para servir'
        },
        entregar: 'Entregar'
      },
      emptyPedidos: {
        titulo: '¡Todo al día!',
        mensaje: 'No hay pedidos pendientes para tu sector.'
      },
      segmentosCuentas: {
        cuentas: 'Cuentas',
        confirmarPago: 'Confirmar Pago'
      },
      tarjetaCuenta: {
        mesa: 'Mesa',
        total: 'Total',
        enviarCuenta: 'Enviar cuenta'
      },
      emptyCuentas: {
        titulo: '¡Todo al día!',
        mensaje: 'No hay clientes pidiendo la cuenta.'
      },
      consultas: {
        mesa: 'Mesa',
        placeholder: 'Escribe tu respuesta aquí...',
        enviar: 'Enviar respuesta',
        contestar: 'Contestar',
        cerrar: 'Cerrar'
      },
      toasts: {
        cuentaConfirmada: 'Cuenta confirmada al cliente',
        errorConfirmarCuenta: 'Error al confirmar la cuenta',
        pagoConfirmado: 'Pago confirmado',
        errorConfirmarPago: 'Error al confirmar pago'
      }
    },
    en: {
      header: { pedidos: 'Orders', cuentas: 'Bills' },
      segmentosPedidos: {
        pendiente: 'Pending',
        enPrep: 'In preparation',
        completado: 'Completed'
      },
      tarjetaPedido: {
        mesa: 'Table',
        productos_uno: 'product',
        productos_muchos: 'products',
        total: 'Total',
        estados: {
          pendiente: '🕒 Pending',
          enPrep: '👨‍🍳 In preparation',
          listo: '✅ Ready to serve'
        },
        entregar: 'Deliver'
      },
      emptyPedidos: {
        titulo: 'All set!',
        mensaje: 'There are no pending orders for your section.'
      },
      segmentosCuentas: {
        cuentas: 'Bills',
        confirmarPago: 'Confirm Payment'
      },
      tarjetaCuenta: {
        mesa: 'Table',
        total: 'Total',
        enviarCuenta: 'Send bill'
      },
      emptyCuentas: {
        titulo: 'All set!',
        mensaje: 'No customers requesting the bill.'
      },
      consultas: {
        mesa: 'Table',
        placeholder: 'Type your reply here...',
        enviar: 'Send reply',
        contestar: 'Reply',
        cerrar: 'Close'
      },
      toasts: {
        cuentaConfirmada: 'Bill confirmed to customer',
        errorConfirmarCuenta: 'Error confirming the bill',
        pagoConfirmado: 'Payment confirmed',
        errorConfirmarPago: 'Error confirming payment'
      }
    },
    pt: {
      header: { pedidos: 'Pedidos', contas: 'Contas' },
      segmentosPedidos: {
        pendiente: 'Pendente',
        enPrep: 'Em preparo',
        completado: 'Concluído'
      },
      tarjetaPedido: {
        mesa: 'Mesa',
        productos_uno: 'produto',
        productos_muchos: 'produtos',
        total: 'Total',
        estados: {
          pendiente: '🕒 Pendente',
          enPrep: '👨‍🍳 Em preparo',
          listo: '✅ Pronto para servir'
        },
        entregar: 'Entregar'
      },
      emptyPedidos: {
        titulo: 'Tudo em dia!',
        mensagem: 'Não há pedidos pendentes para seu setor.'
      },
      segmentosCuentas: {
        contas: 'Contas',
        confirmarPago: 'Confirmar Pagamento'
      },
      tarjetaCuenta: {
        mesa: 'Mesa',
        total: 'Total',
        enviarCuenta: 'Enviar conta'
      },
      emptyCuentas: {
        titulo: 'Tudo em dia!',
        mensagem: 'Não há clientes pedindo a conta.'
      },
      consultas: {
        mesa: 'Mesa',
        placeholder: 'Escreva sua resposta aqui...',
        enviar: 'Enviar resposta',
        contestar: 'Responder',
        cerrar: 'Fechar'
      },
      toasts: {
        cuentaConfirmada: 'Conta confirmada ao cliente',
        errorConfirmarCuenta: 'Erro ao confirmar a conta',
        pagoConfirmado: 'Pagamento confirmado',
        errorConfirmarPago: 'Erro ao confirmar o pagamento'
      }
    },
    fr: {
      header: { pedidos: 'Commandes', cuentas: 'Additions' },
      segmentosPedidos: {
        pendiente: 'En attente',
        enPrep: 'En préparation',
        completado: 'Terminé'
      },
      tarjetaPedido: {
        mesa: 'Table',
        productos_uno: 'produit',
        productos_muchos: 'produits',
        total: 'Total',
        estados: {
          pendiente: '🕒 En attente',
          enPrep: '👨‍🍳 En préparation',
          listo: '✅ Prêt à servir'
        },
        entregar: 'Servir'
      },
      emptyPedidos: {
        titulo: 'Tout est à jour !',
        mensaje: 'Aucune commande en attente pour votre section.'
      },
      segmentosCuentas: {
        cuentas: 'Additions',
        confirmarPago: 'Confirmer le Paiement'
      },
      tarjetaCuenta: {
        mesa: 'Table',
        total: 'Total',
        enviarCuenta: 'Envoyer l’addition'
      },
      emptyCuentas: {
        titulo: 'Tout est à jour !',
        mensaje: 'Aucun client ne demande l’addition.'
      },
      consultas: {
        mesa: 'Table',
        placeholder: 'Écrivez votre réponse ici...',
        enviar: 'Envoyer la réponse',
        contestar: 'Répondre',
        cerrar: 'Fermer'
      },
      toasts: {
        cuentaConfirmada: 'Addition confirmée au client',
        errorConfirmarCuenta: 'Erreur lors de la confirmation de l’addition',
        pagoConfirmado: 'Paiement confirmé',
        errorConfirmarPago: 'Erreur lors de la confirmation du paiement'
      }
    },
    de: {
      header: { pedidos: 'Bestellungen', cuentas: 'Rechnungen' },
      segmentosPedidos: {
        pendiente: 'Ausstehend',
        enPrep: 'In Vorbereitung',
        completado: 'Abgeschlossen'
      },
      tarjetaPedido: {
        mesa: 'Tisch',
        productos_uno: 'Produkt',
        productos_muchos: 'Produkte',
        total: 'Gesamt',
        estados: {
          pendiente: '🕒 Ausstehend',
          enPrep: '👨‍🍳 In Vorbereitung',
          listo: '✅ Servierfertig'
        },
        entregar: 'Servieren'
      },
      emptyPedidos: {
        titulo: 'Alles erledigt!',
        mensaje: 'Keine offenen Bestellungen in deinem Bereich.'
      },
      segmentosCuentas: {
        cuentas: 'Rechnungen',
        confirmarPago: 'Zahlung Bestätigen'
      },
      tarjetaCuenta: {
        mesa: 'Tisch',
        total: 'Gesamt',
        enviarCuenta: 'Rechnung senden'
      },
      emptyCuentas: {
        titulo: 'Alles erledigt!',
        mensaje: 'Keine Kunden fragen nach der Rechnung.'
      },
      consultas: {
        mesa: 'Tisch',
        placeholder: 'Schreibe hier deine Antwort...',
        enviar: 'Antwort senden',
        contestar: 'Antworten',
        cerrar: 'Schließen'
      },
      toasts: {
        cuentaConfirmada: 'Rechnung dem Kunden bestätigt',
        errorConfirmarCuenta: 'Fehler beim Bestätigen der Rechnung',
        pagoConfirmado: 'Zahlung bestätigt',
        errorConfirmarPago: 'Fehler bei der Zahlungsbestätigung'
      }
    },
    ru: {
      header: { pedidos: 'Заказы', cuentas: 'Счета' },
      segmentosPedidos: {
        pendiente: 'В ожидании',
        enPrep: 'Готовится',
        completado: 'Завершено'
      },
      tarjetaPedido: {
        mesa: 'Стол',
        productos_uno: 'блюдо',
        productos_muchos: 'блюд',
        total: 'Итого',
        estados: {
          pendiente: '🕒 В ожидании',
          enPrep: '👨‍🍳 Готовится',
          listo: '✅ Готово к подаче'
        },
        entregar: 'Подать'
      },
      emptyPedidos: {
        titulo: 'Все готово!',
        mensaje: 'Нет ожидающих заказов для вашего сектора.'
      },
      segmentosCuentas: {
        cuentas: 'Счета',
        confirmarPago: 'Подтвердить оплату'
      },
      tarjetaCuenta: {
        mesa: 'Стол',
        total: 'Итого',
        enviarCuenta: 'Отправить счет'
      },
      emptyCuentas: {
        titulo: 'Все готово!',
        mensaje: 'Нет клиентов, запрашивающих счет.'
      },
      consultas: {
        mesa: 'Стол',
        placeholder: 'Введите ответ здесь...',
        enviar: 'Отправить ответ',
        contestar: 'Ответить',
        cerrar: 'Закрыть'
      },
      toasts: {
        cuentaConfirmada: 'Счет подтвержден клиенту',
        errorConfirmarCuenta: 'Ошибка при подтверждении счета',
        pagoConfirmado: 'Оплата подтверждена',
        errorConfirmarPago: 'Ошибка при подтверждении оплаты'
      }
    },
    ja: {
      header: { pedidos: '注文', cuentas: '会計' },
      segmentosPedidos: {
        pendiente: '保留中',
        enPrep: '準備中',
        completado: '完了'
      },
      tarjetaPedido: {
        mesa: 'テーブル',
        productos_uno: '品',
        productos_muchos: '品',
        total: '合計',
        estados: {
          pendiente: '🕒 保留中',
          enPrep: '👨‍🍳 準備中',
          listo: '✅ 提供準備完了'
        },
        entregar: '提供する'
      },
      emptyPedidos: {
        titulo: 'すべて順調！',
        mensaje: 'このセクションに保留中の注文はありません。'
      },
      segmentosCuentas: {
        cuentas: '会計',
        confirmarPago: '支払い確認'
      },
      tarjetaCuenta: {
        mesa: 'テーブル',
        total: '合計',
        enviarCuenta: '会計を送信'
      },
      emptyCuentas: {
        titulo: 'すべて順調！',
        mensaje: '会計を希望するお客様はいません。'
      },
      consultas: {
        mesa: 'テーブル',
        placeholder: 'ここに返信を入力してください…',
        enviar: '返信を送信',
        contestar: '返信する',
        cerrar: '閉じる'
      },
      toasts: {
        cuentaConfirmada: '会計をお客様に確認しました',
        errorConfirmarCuenta: '会計の確認でエラーが発生しました',
        pagoConfirmado: '支払いが確認されました',
        errorConfirmarPago: '支払い確認中にエラーが発生しました'
      }
    }
  };

}
