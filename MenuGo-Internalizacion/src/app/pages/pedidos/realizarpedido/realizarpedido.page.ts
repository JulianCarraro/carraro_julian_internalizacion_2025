import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { ProductoService } from 'src/app/services/producto.service';
import { AuthService } from 'src/app/services/auth.service';
import { PedidoService } from 'src/app/services/pedido.service';
import { Router } from '@angular/router';
import { MesaService } from 'src/app/services/mesa.service';
import { addIcons } from 'ionicons';
import { logOut, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { register } from 'swiper/element/bundle';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { MapaidiomaPage } from '../../mapaidioma/mapaidioma.page';
import { LanguageService } from 'src/app/services/language.service';

register();

@Component({
  selector: 'app-realizarpedido',
  templateUrl: './realizarpedido.page.html',
  styleUrls: ['./realizarpedido.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IMPORTS_IONIC, MapaidiomaPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RealizarpedidoPage implements OnInit {

  isLoading: boolean = false;
  categoriaSeleccionada = 'bebidas';
  categorias = ['bebidas', 'comidas', 'postres'];
  productos: any[] = [];
  productoActualIndex: number = 0;
  pedido: { producto: any, cantidad: number }[] = [];
  resetTimeout: any;
  productoActivoId: string | null = null;
  mostrarResumen = false;
  idMesa: any;
  idReserva: any;
  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);


  constructor(private productoService: ProductoService, private authService: AuthService,
    private pedidoService: PedidoService, private router: Router, private mesaService: MesaService, private notisService: NotificacionesService) {
    addIcons({ logOut, chevronBackOutline, chevronForwardOutline });
  }

  async ngOnInit() {
    console.log("en el init de pedido");

    this.isLoading = true;
    await this.productoService.getProductos().then(data => {
      this.productos = data.map((p: any) => ({
        ...p,
        imagenActual: 0
      }));
      this.isLoading = false;
      console.log("productos", this.productos);
    });

    this.idMesa = await this.mesaService.obtenerIdMesa();

    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  getCategoriaLabel(): string {
    const t = this.textos[this.currentLang]?.categorias;
    return t?.[this.categoriaSeleccionada] ?? this.categoriaSeleccionada;
  }


  productosFiltrados() {
    return this.productos.filter(p => {
      if (this.categoriaSeleccionada === 'bebidas') {
        return p.sector === 'bar';
      }

      if (this.categoriaSeleccionada === 'comidas') {
        return p.sector === 'cocina' && p.tipo === 'comidas';
      }

      if (this.categoriaSeleccionada === 'postres') {
        return p.sector === 'cocina' && p.tipo === 'postres';
      }

      return false;
    });
  }

  cambiarImagen(producto: any, direccion: number) {
    const total = producto.fotos.length;
    producto.imagenActual = (producto.imagenActual + direccion + total) % total;
  }

  get productoActual() {
    return this.productosFiltrados()[this.productoActualIndex];
  }

  cambiarProducto(direccion: number) {
    const productos = this.productosFiltrados();
    this.productoActualIndex = (this.productoActualIndex + direccion + productos.length) % productos.length;

    if (this.productoActual) {
      this.productoActual.imagenActual = 0;
    }
  }



  onCategoriaChange(event: any) {
    this.categoriaSeleccionada = event.detail.value;
    console.log('Categoría cambiada a:', this.categoriaSeleccionada);
  }

  cambiarCategoria(direccion: number) {
    const indiceActual = this.categorias.indexOf(this.categoriaSeleccionada);
    const nuevoIndice = (indiceActual + direccion + this.categorias.length) % this.categorias.length;
    this.categoriaSeleccionada = this.categorias[nuevoIndice];
  }



  agregarAlPedido(producto: any) {
    this.productoActivoId = producto.id;
    this.reiniciarTemporizador();


    const item = this.pedido.find(p => p.producto.id === producto.id);
    if (!item) {
      this.pedido.push({ producto, cantidad: 1 });
    }
  }

  sumarCantidad(producto: any) {
    const item = this.pedido.find(p => p.producto.id === producto.id);
    if (item) item.cantidad++;
    this.reiniciarTemporizador();
  }

  restarCantidad(producto: any) {
    const index = this.pedido.findIndex(p => p.producto.id === producto.id);
    if (index > -1) {
      if (this.pedido[index].cantidad > 1) {
        this.pedido[index].cantidad--;
      } else {
        this.pedido.splice(index, 1);
      }
    }
    this.reiniciarTemporizador();
  }

  // obtenerCantidad(producto: any): number {
  //   const item = this.pedido.find(p => p.producto.id === producto.id);
  //   return item ? item.cantidad : 0;
  // }

  obtenerCantidad(producto: any): number {
    if (!producto) return 0;
    const item = this.pedido.find(p => p.producto.id === producto.id);
    return item ? item.cantidad : 0;
  }

  estaEnPedido(producto: any): boolean {
    return this.pedido.some(p => p.producto.id === producto.id);
  }

  // esActivo(producto: any): boolean {
  //   return this.productoActivoId === producto.id;
  // }

  esActivo(producto: any): boolean {
    if (!producto) {
      return false;
    }
    return this.productoActivoId === producto.id;
  }


  reiniciarTemporizador() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }

    this.resetTimeout = setTimeout(() => {
      this.productoActivoId = null;
    }, 15000);
  }

  getTotal(): number {
    return this.pedido.reduce((acc, item) => acc + (item.cantidad * item.producto.precio), 0);
  }

  getCantidadTotal(): number {
    return this.pedido.reduce((acc, item) => acc + item.cantidad, 0);
  }

  getTiempoEstimadoTotal(): number {
    return this.pedido.reduce((max, item) => {
      const tiempo = item.producto.tiempoElaboracion ?? 0;
      return Math.max(max, tiempo);
    }, 0);
  }

  eliminarDelPedido(producto: any) {
    const index = this.pedido.findIndex(p => p.producto.id === producto.id);
    if (index > -1) {
      this.pedido.splice(index, 1);
      if (this.productoActivoId === producto.id) {
        this.productoActivoId = null;
      }
    }
  }

  async confirmarPedido() {
    this.isLoading = true;
    try {
      const clienteId = this.authService.getUserData()["id"];
      const reservaId = await this.mesaService.obtenerUltimaReserva(clienteId);
      // this.idReserva = this.mesaService.obtenerReservaId();

      const productosIds: string[] = this.pedido.reduce((acc: string[], item) => {
        const idsRepetidos = Array(item.cantidad).fill(item.producto.id);
        return acc.concat(idsRepetidos);
      }, []);

      console.log('IDs enviados:', productosIds);

      // const idPedido = await this.pedidoService.crearPedido(productosIds, this.idReserva);
      const idPedido = await this.pedidoService.crearPedido(productosIds, reservaId);

      // Limpiar el pedido
      this.pedido = [];
      this.productoActivoId = null;
      this.mostrarResumen = false;

      // Mostrar confirmación al usuario
      // Podés usar un toast o alerta acá
      let reserva = await this.mesaService.obtenerReserva(clienteId);
      console.log(reserva);

      let mesa = await this.mesaService.obtenerMesaPorId(reserva.mesaId);
      console.log(mesa);

      const { titulo, cuerpo } = this.textos[this.currentLang].notis.pedido;

      this.notisService.sendConsultaMozos(titulo, cuerpo.replace('{n}', String(mesa.numero)), "/panelmozo")
      this.router.navigate(['/local']);

    } catch (error) {
      console.error('Error al confirmar el pedido:', error);
      // Mostrar error al usuario si querés
    } finally {
      this.isLoading = false;
    }
  }

  borrarPedido() {
    this.pedido = [];
    this.mostrarResumen = false;
    this.productoActivoId = null;
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
      header: "Realizar pedido",
      categorias: { bebidas: "Bebidas", comidas: "Comidas", postres: "Postres" },
      resumen: {
        precio: "PRECIO",
        verPedido: "Ver Pedido",
        productos: "productos",
        tiempo: "Tiempo Estimado",
        tuPedido: "Tu Pedido",
        cantidad: "Cantidad",
        subtotal: "Subtotal",
        total: "Total",
        confirmar: "✅ Confirmar Pedido",
        borrarTodo: "🗑️ Borrar Todo",
        cerrar: "Cerrar",
        min: "min"
      },
      toasts: {
        pedidoOk: "Pedido enviado con éxito.",
        pedidoError: "Ocurrió un error al confirmar el pedido.",
        pedidoVacio: "No hay productos en el pedido.",
        pedidoBorrado: "Se borró el pedido."
      },
      notis: {
        pedido: { titulo: "🍴 Pedido recibido", cuerpo: "Mesa #{n} acaba de confirmar su comanda" }
      }
    },
    en: {
      header: "Place Order",
      categorias: { bebidas: "Drinks", comidas: "Food", postres: "Desserts" },
      resumen: {
        precio: "PRICE",
        verPedido: "View Order",
        productos: "items",
        tiempo: "Estimated Time",
        tuPedido: "Your Order",
        cantidad: "Quantity",
        subtotal: "Subtotal",
        total: "Total",
        confirmar: "✅ Confirm Order",
        borrarTodo: "🗑️ Clear All",
        cerrar: "Close",
        min: "min"
      },
      toasts: {
        pedidoOk: "Order sent successfully.",
        pedidoError: "There was an error confirming the order.",
        pedidoVacio: "Your order is empty.",
        pedidoBorrado: "Order cleared."
      },
      notis: {
        pedido: { titulo: "🍴 Order received", cuerpo: "Table #{n} has confirmed their order" }
      }
    },
    pt: {
      header: "Fazer pedido",
      categorias: { bebidas: "Bebidas", comidas: "Comidas", postres: "Sobremesas" },
      resumen: {
        precio: "PREÇO",
        verPedido: "Ver Pedido",
        productos: "itens",
        tiempo: "Tempo Estimado",
        tuPedido: "Seu Pedido",
        cantidad: "Quantidade",
        subtotal: "Subtotal",
        total: "Total",
        confirmar: "✅ Confirmar Pedido",
        borrarTodo: "🗑️ Limpar Tudo",
        cerrar: "Fechar",
        min: "min"
      },
      toasts: {
        pedidoOk: "Pedido enviado com sucesso.",
        pedidoError: "Erro ao confirmar o pedido.",
        pedidoVacio: "Não há itens no pedido.",
        pedidoBorrado: "Pedido apagado."
      },
      notis: {
        pedido: { titulo: "🍴 Pedido recebido", cuerpo: "Mesa #{n} confirmou seu pedido" }
      }
    },
    fr: {
      header: "Passer commande",
      categorias: { bebidas: "Boissons", comidas: "Plats", postres: "Desserts" },
      resumen: {
        precio: "PRIX",
        verPedido: "Voir la commande",
        productos: "articles",
        tiempo: "Temps estimé",
        tuPedido: "Votre commande",
        cantidad: "Quantité",
        subtotal: "Sous-total",
        total: "Total",
        confirmar: "✅ Confirmer la commande",
        borrarTodo: "🗑️ Tout effacer",
        cerrar: "Fermer",
        min: "min"
      },
      toasts: {
        pedidoOk: "Commande envoyée avec succès.",
        pedidoError: "Erreur lors de la confirmation.",
        pedidoVacio: "Votre commande est vide.",
        pedidoBorrado: "Commande effacée."
      },
      notis: {
        pedido: { titulo: "🍴 Commande reçue", cuerpo: "Table #{n} vient de confirmer sa commande" }
      }
    },
    de: {
      header: "Bestellung aufgeben",
      categorias: { bebidas: "Getränke", comidas: "Speisen", postres: "Desserts" },
      resumen: {
        precio: "PREIS",
        verPedido: "Bestellung ansehen",
        productos: "Artikel",
        tiempo: "Geschätzte Zeit",
        tuPedido: "Deine Bestellung",
        cantidad: "Menge",
        subtotal: "Zwischensumme",
        total: "Gesamt",
        confirmar: "✅ Bestellung bestätigen",
        borrarTodo: "🗑️ Alles löschen",
        cerrar: "Schließen",
        min: "Min."
      },
      toasts: {
        pedidoOk: "Bestellung erfolgreich gesendet.",
        pedidoError: "Fehler beim Bestätigen der Bestellung.",
        pedidoVacio: "Keine Artikel in der Bestellung.",
        pedidoBorrado: "Bestellung gelöscht."
      },
      notis: {
        pedido: { titulo: "🍴 Bestellung erhalten", cuerpo: "Tisch #{n} hat soeben bestätigt" }
      }
    },
    ru: {
      header: "Оформить заказ",
      categorias: { bebidas: "Напитки", comidas: "Блюда", postres: "Десерты" },
      resumen: {
        precio: "ЦЕНА",
        verPedido: "Посмотреть заказ",
        productos: "позиций",
        tiempo: "Расчетное время",
        tuPedido: "Ваш заказ",
        cantidad: "Количество",
        subtotal: "Промежуточный итог",
        total: "Итого",
        confirmar: "✅ Подтвердить заказ",
        borrarTodo: "🗑️ Очистить всё",
        cerrar: "Закрыть",
        min: "мин"
      },
      toasts: {
        pedidoOk: "Заказ успешно отправлен.",
        pedidoError: "Ошибка при подтверждении заказа.",
        pedidoVacio: "В заказе нет товаров.",
        pedidoBorrado: "Заказ удалён."
      },
      notis: {
        pedido: { titulo: "🍴 Заказ получен", cuerpo: "Стол #{n} только что подтвердил заказ" }
      }
    },
    ja: {
      header: "注文する",
      categorias: { bebidas: "ドリンク", comidas: "フード", postres: "デザート" },
      resumen: {
        precio: "価格",
        verPedido: "注文を表示",
        productos: "品",
        tiempo: "予想時間",
        tuPedido: "ご注文",
        cantidad: "数量",
        subtotal: "小計",
        total: "合計",
        confirmar: "✅ 注文を確定",
        borrarTodo: "🗑️ すべて削除",
        cerrar: "閉じる",
        min: "分"
      },
      toasts: {
        pedidoOk: "注文を送信しました。",
        pedidoError: "注文の確定に失敗しました。",
        pedidoVacio: "注文が空です。",
        pedidoBorrado: "注文を削除しました。"
      },
      notis: {
        pedido: { titulo: "🍴 注文を受信", cuerpo: "テーブル#{n} が注文を確定しました" }
      }
    }
  };

}
