import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerAndroidScanningLibrary,
  CapacitorBarcodeScannerOptions
} from '@capacitor/barcode-scanner';
import { ClienteService } from './cliente.service';
import { MesaService } from './mesa.service';
import { ReservaService } from './reserva.service';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class QrService {
  constructor(
    private toastController: ToastController,
    private clienteService: ClienteService,
    private mesaService: MesaService,
    private reservaService: ReservaService
  ) { }

  private readonly GRACE_PERIOD_MINUTES = 3;
  

  /**
   * Escanea un QR y devuelve el contenido si es exitoso.
   */
  async scanQr(): Promise<string | null> {
    const options: CapacitorBarcodeScannerOptions = {
      hint: 0,
      scanText: 'Escanea un código QR',
      scanButton: false,
      cameraDirection: 1,
      android: {
        scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.ZXING
      }
    };

    try {
      const result = await CapacitorBarcodeScanner.scanBarcode(options);
      if (result.ScanResult) {
        return result.ScanResult;
      } else {
        this.presentErrorToast('No se detectó un QR.');
        return null;
      }
    } catch (error: any) {
      if (error === 'PERMISSION_DENIED') {
        this.presentErrorToast('Se requieren permisos de cámara.');
      } else {
        this.presentErrorToast(`Error de escaneo: ${error}`);
      }
      return null;
    } finally {
    }
  }

  /** Comprueba si la reserva expiró */
  private isReservationExpired(startTime: Timestamp): boolean {
    const startMs = startTime.toDate().getTime();
    const expirationMs = startMs + this.GRACE_PERIOD_MINUTES * 60 * 1000;
    return Date.now() > expirationMs;
  }

  public async scan(id: any, estado: any) {
    const resultado = await this.scanQr(); // Este debe retornar un string (ej: 'lista de espera' o ID de mesa)

    if (resultado != null && resultado.startsWith('propina')) {
      return { tipo: 'propina', resultado: resultado };
    }

    switch (resultado) {
      case 'lista de espera':
        if (estado != "aprobado") {
          if (estado == "pago aprobado") {
            return { tipo: 'graficos', resultado: null };
          }
          throw new Error("No puede volver a ingresar en la lista de espera.");
        }
        await this.clienteService.agregarAListaEspera(id);
        return { tipo: 'lista', resultado: null };
      case 'propina':
        return { tipo: 'propina', resultado: null };
      default:
        if (estado == "esperando pedido" || estado == "pedido en mesa") {
          return { tipo: 'esperando pedido' };
        }
        else {
          if (resultado) {
            const mesa = await this.mesaService.validarMesaUsuario(resultado, id);
            return { tipo: 'mesa', resultado: mesa };
          }
        }
        break;
    }

    return { tipo: 'error', resultado: null };
  }

  private async presentErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger',
      icon: 'alert-circle-outline'
    });
    await toast.present();
  }
}