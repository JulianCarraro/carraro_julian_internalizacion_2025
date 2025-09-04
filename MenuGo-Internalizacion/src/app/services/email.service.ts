import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor() {
    emailjs.init(environment.emailJsPublicKey);
  }

  async sendApprovedEmail(toName: string, toEmail: string) {

    const logoUrl = 'https://ykisgutbszmgkqoreuyp.supabase.co/storage/v1/object/public/menugo/public/logo/logoApp.png'

    // const logoBase64 = await this.getLogoBase64();
    
    console.log("email", toEmail);
    await emailjs
      .send('service_700vysx', 'template_9z3yuig', {
        Subject: 'Notificación sobre el estado de su cuenta',
        to_email: toEmail,
        to_name:
          toName[0].toUpperCase() +
          toName.slice(1, toName.length).toLowerCase(),
        message_title: '¡Tu cuenta ha sido aprobada!', 
        message_one: 'Enhorabuena, tu registro a "MenuGo" acaba de ser aprobado.',
        message_two: "Ya podés inciar sesión con tu correo electrónico '" + toEmail + "'.",
        company_phone: '1165343220',  
        company_email: 'menugorestaurantes@gmail.com', 
        logo_url: logoUrl,
      })
      .then(
        (response) => {
          console.log('email sent', response.status, response.text);
        },
        (err) => {
          console.log('an error has occurred', err);
        }
      );
  }

  async sendRejectedEmail(toName: string, toEmail: string) {

    const logoUrl = 'https://ykisgutbszmgkqoreuyp.supabase.co/storage/v1/object/public/menugo/public/logo/logoApp.png'
    const logoBase64 = await this.getLogoBase64();


    await emailjs
      .send('service_700vysx', 'template_9z3yuig', {
        Subject: 'Notificación sobre el estado de su cuenta',
        to_email: toEmail,
        to_name:
          toName[0].toUpperCase() +
          toName.slice(1, toName.length).toLowerCase(),
        message_title: 'Tu solicitud ha sido rechazada',  
        message_one: 'Lamentamos informarle que su solicitud ha sido rechazada por la administración.',
        message_two: 'Te invitamos a registrarte nuevamente.',
        company_phone: '1165343220',
        company_email: 'menugorestaurantes@gmail.com',
        logo_url: logoUrl,
      })
      .then(
        (response) => {
          console.log('email sent', response.status, response.text);
        },
        (err) => {
          console.log('an error has occurred', err);
        }
      );
  }

  async getLogoBase64(): Promise<string> {
    const logo = '/assets/logoApp.png'; 
    const response = await fetch(logo);
    const blob = await response.blob();
    const base64 = await this.convertToBase64(blob);
    return base64;
  }

  convertToBase64(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }




}
