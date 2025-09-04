import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from 'src/app/services/cliente.service';
import { AuthService } from 'src/app/services/auth.service';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { ReservaService } from 'src/app/services/reserva.service';
import { MesaService } from 'src/app/services/mesa.service';
import { addIcons } from 'ionicons';
import { sendOutline } from 'ionicons/icons';
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IMPORTS_IONIC]
})
export class ChatPage implements OnInit {

  themeClass = 'theme-b';
  clienteId = '';
  clienteNombre = '';
  newMessage = '';
  messages: any[] = [];
  userData: any;
  isSending = false;
  user: any;
  nroDeMesa: any;
  currentLang: string = 'es';
  langService = inject(LanguageService);

  loading = true;
  @ViewChild('content') content: any;
  @ViewChild('msgInput') msgInput!: ElementRef;

  constructor(private clienteService: ClienteService, private authService: AuthService,
    private reservaService: ReservaService, private mesaService: MesaService) {
    addIcons({sendOutline});
  }

  textos: any = {
    es: {
      placeholders: { escribir: 'Escribe un mensaje…' },
      toasts: { vacio: 'Escribe algo antes de enviar', error: 'No se pudo enviar el mensaje' }
    },
    en: {
      placeholders: { escribir: 'Type a message…' },
      toasts: { vacio: 'Type something before sending', error: 'Message could not be sent' }
    },
    pt: {
      placeholders: { escribir: 'Escreva uma mensagem…' },
      toasts: { vacio: 'Escreva algo antes de enviar', error: 'Não foi possível enviar a mensagem' }
    },
    fr: {
      placeholders: { escribir: 'Écrivez un message…' },
      toasts: { vacio: 'Écrivez quelque chose avant d’envoyer', error: 'Impossible d’envoyer le message' }
    },
    de: {
      placeholders: { escribir: 'Schreib eine Nachricht…' },
      toasts: { vacio: 'Schreibe etwas, bevor du sendest', error: 'Nachricht konnte nicht gesendet werden' }
    },
    ru: {
      placeholders: { escribir: 'Напишите сообщение…' },
      toasts: { vacio: 'Введите текст перед отправкой', error: 'Не удалось отправить сообщение' }
    },
    ja: {
      placeholders: { escribir: 'メッセージを入力…' },
      toasts: { vacio: '送信前に入力してください', error: 'メッセージを送信できませんでした' }
    }
  };

  ngOnInit() {

    console.log("entramos al chat");
    this.user = this.authService.getUserData();
    this.clienteId = this.user.id;
    this.clienteNombre = this.user.nombre;

    this.loading = true;
    this.clienteService.getMessages(this.clienteId).subscribe(messages => {
      this.messages = messages.map(msg => ({
        text: msg.text,
        author: msg.author,
        date: msg.date?.toDate?.() ?? msg.clientDate,
      }));

      this.loading = false;
      setTimeout(() => this.content?.scrollToBottom(300), 50);
    });

    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
    });
  }


  async send() {
    if (this.isSending) return;

    const reserva = await this.reservaService.getReservaPorIdCliente(this.clienteId);
    if (reserva) {
      const mesaCliente = await this.mesaService.getMesaPorId(reserva.mesaId);
      if (mesaCliente) {
        this.nroDeMesa = mesaCliente.numero;
      }
    }

    const text = this.newMessage.trim();
    if (!text) return;

    const clientDate = new Date();
    this.isSending = true;

    this.messages.push({
      text,
      author: this.user.nombre,
      clientDate,
      mesa: this.nroDeMesa
    });

    this.newMessage = '';
    setTimeout(() => this.content?.scrollToBottom(300), 50);

    await this.clienteService.enviarMensajeCliente(
      this.clienteId,
      text,
      this.user.nombre,
      this.nroDeMesa
    );


    this.isSending = false;
    setTimeout(() => this.msgInput?.nativeElement.setFocus(), 100);
  }

  onInputFocus() {
    setTimeout(() => {
      this.content?.scrollToBottom(300);
    }, 50);
  }

  logout() {
    this.authService.logOut();
    // this.navCtrl.navigateRoot('/login');
  }

  home() {
    // this.navCtrl.navigateRoot('/home');
  }


}
