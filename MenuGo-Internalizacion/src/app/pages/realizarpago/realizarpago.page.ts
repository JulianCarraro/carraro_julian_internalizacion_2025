import { ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { ActivatedRoute, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { AuthService } from 'src/app/services/auth.service';
import { PedidoService } from 'src/app/services/pedido.service';
import { MesaService } from 'src/app/services/mesa.service';
import { ToastController } from '@ionic/angular';
import { ReservaService } from 'src/app/services/reserva.service';
import { MapaidiomaPage } from "../mapaidioma/mapaidioma.page";
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-realizarpago',
  templateUrl: './realizarpago.page.html',
  styleUrls: ['./realizarpago.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IMPORTS_IONIC, MapaidiomaPage]
})
export class RealizarpagoPage implements OnInit {

  totalPagar: number = 0;
  userData: any;
  isLoading: boolean = false;
  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);

  constructor(private router: Router, private clienteService: ClienteService,
    private authService: AuthService, private pedidoService: PedidoService,
    private mesaService: MesaService, private cdr: ChangeDetectorRef, private toastController: ToastController, private reservaService: ReservaService) { }

  async ngOnInit() {

    this.userData = await this.authService.getUserData();

    const totalGuardado = sessionStorage.getItem('totalAPagar');
    if (totalGuardado) {
      this.totalPagar = Number(totalGuardado);
      this.cdr.markForCheck();
    } else {
      console.warn("No se encontró 'totalAPagar' en sessionStorage");
    }

    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
    });

    sessionStorage.removeItem('totalAPagar');

  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  async realizarPago() {

    try {
      this.isLoading = true;
      await this.clienteService.cambiarEstadoUsuario(this.userData.id, "confirmando pago");
      const reservaId = await this.mesaService.obtenerUltimaReserva(this.userData.id);

      if (!reservaId) {
        console.error('No se encontró una reserva para este cliente');
        return;
      }

      const pedido = await this.pedidoService.getPedidoPorReservaId(reservaId);
      await this.pedidoService.cambiarEstadoPedido(pedido[0].idPedido, "confirmando pago");
      await this.presentToast(this.textos[this.currentLang].toasts.success, 'success');

      this.isLoading = false;
      this.router.navigate(['/local']);

    } catch (error) {
      console.error('Error realizando el pago', error);
      await this.presentToast(this.textos[this.currentLang].toasts.error, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async presentToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      color
    });
    toast.present();
  }

  textos: any = {
    es: {
      header: "Pagar",
      brand: "Código Bendito",
      total: "Total",
      available: "DINERO DISPONIBLE",
      noFee: "Sin comisión",
      transfer: "Transferir",
      toasts: {
        success: "Pago realizado con éxito",
        error: "Hubo un error al realizar el pago"
      },
      loading: "Procesando pago…"
    },
    en: {
      header: "Pay",
      brand: "Código Bendito",
      total: "Total",
      available: "AVAILABLE BALANCE",
      noFee: "No fee",
      transfer: "Transfer",
      toasts: {
        success: "Payment completed successfully",
        error: "There was an error processing the payment"
      },
      loading: "Processing payment…"
    },
    pt: {
      header: "Pagar",
      brand: "Código Bendito",
      total: "Total",
      available: "SALDO DISPONÍVEL",
      noFee: "Sem comissão",
      transfer: "Transferir",
      toasts: {
        success: "Pagamento realizado com sucesso",
        error: "Ocorreu um erro ao processar o pagamento"
      },
      loading: "Processando pagamento…"
    },
    fr: {
      header: "Payer",
      brand: "Código Bendito",
      total: "Total",
      available: "SOLDE DISPONIBLE",
      noFee: "Sans commission",
      transfer: "Transférer",
      toasts: {
        success: "Paiement effectué avec succès",
        error: "Une erreur est survenue lors du paiement"
      },
      loading: "Traitement du paiement…"
    },
    de: {
      header: "Bezahlen",
      brand: "Código Bendito",
      total: "Gesamt",
      available: "VERFÜGBARES GUTHABEN",
      noFee: "Keine Gebühren",
      transfer: "Überweisen",
      toasts: {
        success: "Zahlung erfolgreich abgeschlossen",
        error: "Beim Bezahlen ist ein Fehler aufgetreten"
      },
      loading: "Zahlung wird verarbeitet…"
    },
    ru: {
      header: "Оплата",
      brand: "Código Bendito",
      total: "Итого",
      available: "ДОСТУПНЫЕ СРЕДСТВА",
      noFee: "Без комиссии",
      transfer: "Перевести",
      toasts: {
        success: "Оплата успешно выполнена",
        error: "Произошла ошибка при оплате"
      },
      loading: "Обработка платежа…"
    },
    ja: {
      header: "支払い",
      brand: "Código Bendito",
      total: "合計",
      available: "利用可能残高",
      noFee: "手数料なし",
      transfer: "送金する",
      toasts: {
        success: "支払いが完了しました",
        error: "支払い処理中にエラーが発生しました"
      },
      loading: "支払いを処理中…"
    }
  };


}
