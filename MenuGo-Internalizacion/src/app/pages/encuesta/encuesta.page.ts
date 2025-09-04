import { Component, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import {
  restaurant, star, starOutline, send,
  checkmarkCircle, fastFood, people, cash
} from 'ionicons/icons';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { AuthService } from 'src/app/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  query,
  where,
  getDocs,
  updateDoc
} from '@angular/fire/firestore';
import { MapaidiomaPage } from "../mapaidioma/mapaidioma.page";
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-encuesta',
  templateUrl: './encuesta.page.html',
  styleUrls: ['./encuesta.page.scss'],
  standalone: true,
  imports: [IMPORTS_IONIC, CommonModule, FormsModule, MapaidiomaPage]
})
export class EncuestaPage {
  foodRating: number = 0;
  serviceRating: number = 0;
  priceRating: number = 0;
  comments: string = '';
  isLoading: boolean = false;
  submitted: boolean = false;
  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);


  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private alertController: AlertController,
    private router: Router
  ) {
    addIcons({
      restaurant, star, starOutline, send,
      checkmarkCircle, fastFood, people, cash
    });
  }

  ngOnInit() {
    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  setFoodRating(rating: number) {
    this.foodRating = rating;
  }

  setServiceRating(rating: number) {
    this.serviceRating = rating;
  }

  setPriceRating(rating: number) {
    this.priceRating = rating;
  }

  canSubmit(): boolean {
    return this.foodRating > 0 &&
      this.serviceRating > 0 &&
      this.priceRating > 0;
  }

  async submitSurvey() {
    if (!this.canSubmit()) {
      return;
    }

    this.isLoading = true;

    try {
      const user = this.authService.getUserData();

      if (!user) {
        this.showError(this.textos[this.currentLang].errores.login);
        this.router.navigate(['/login']);
        return;
      }

      const surveyData = {
        userId: user.id,
        userEmail: user.email,
        userName: user.nombre || 'Anónimo',
        foodRating: this.foodRating,
        serviceRating: this.serviceRating,
        priceRating: this.priceRating,
        comments: this.comments,
        date: new Date(),
        foto: user.foto
      };


      // Guardar en Firestore
      const encuestasRef = collection(this.firestore, 'encuestas');
      await addDoc(encuestasRef, surveyData);

      //Cambio el esato de la reseña
      const reservasRef = collection(this.firestore, 'reservas');
      const q = query(reservasRef,
        where('clienteId', '==', user.id),
        where('estado', '==', 'activa')
      );

      const snapshot = await getDocs(q);

      // Si hay al menos una reserva activa, actualizamos la primera
      if (!snapshot.empty) {
        const reservaDoc = snapshot.docs[0];
        await updateDoc(reservaDoc.ref, { resena: true });
        console.log('Reserva actualizada con reseña');
      } else {
        console.warn('No se encontró reserva activa para este cliente');
      }
      // Mostrar mensaje de éxito
      this.submitted = true;

      // Resetear formulario después de 3 segundos
      setTimeout(() => {
        this.resetForm();
        this.router.navigate(['/local']);
      }, 3000);

    } catch (error) {
      console.error('Error al enviar encuesta:', error);
      this.showError(this.textos[this.currentLang].errores.envio);
    } finally {
      this.isLoading = false;
    }
  }

  resetForm() {
    this.foodRating = 0;
    this.serviceRating = 0;
    this.priceRating = 0;
    this.comments = '';
    this.submitted = false;
  }

  async showError(message: string) {
    const alert = await this.alertController.create({
      header: this.textos[this.currentLang].errores.header,
      message,
      buttons: [this.textos[this.currentLang].errores.ok]
    });

    await alert.present();
  }

  async back() {
    this.router.navigate(["/local"]);
  }

  textos: any = {
    es: {
      header: "Encuesta",
      headerSection: {
        titulo: "¿Cómo fue tu experiencia?",
        subtitulo: "Valora diferentes aspectos de tu visita y déjanos tus comentarios"
      },
      ratings: {
        comida: "Calidad de la Comida",
        atencion: "Atención del Personal",
        precio: "Relación Calidad-Precio",
        estrellas: "{n}/5 estrellas"
      },
      comentarios: {
        titulo: "Comentarios adicionales",
        placeholder: "¿Algo que nos quieras decir sobre tu experiencia? (Máx. 200 caracteres)",
        contador: "{n}/200 caracteres"
      },
      enviar: "Enviar Encuesta",
      confirmacion: "¡Gracias por tu opinión! Tu encuesta ha sido enviada.",
      errores: {
        login: "Debes iniciar sesión para enviar una encuesta",
        envio: "Hubo un problema al enviar tu encuesta. Por favor intenta de nuevo.",
        header: "Error",
        ok: "OK"
      }
    },

    en: {
      header: "Survey",
      headerSection: {
        titulo: "How was your experience?",
        subtitulo: "Rate different aspects of your visit and leave us your comments"
      },
      ratings: {
        comida: "Food Quality",
        atencion: "Staff Service",
        precio: "Value for Money",
        estrellas: "{n}/5 stars"
      },
      comentarios: {
        titulo: "Additional comments",
        placeholder: "Anything you'd like to tell us about your experience? (Max. 200 characters)",
        contador: "{n}/200 characters"
      },
      enviar: "Submit Survey",
      confirmacion: "Thank you for your feedback! Your survey has been sent.",
      errores: {
        login: "You must log in to submit a survey",
        envio: "There was a problem submitting your survey. Please try again.",
        header: "Error",
        ok: "OK"
      }
    },

    pt: {
      header: "Pesquisa",
      headerSection: {
        titulo: "Como foi sua experiência?",
        subtitulo: "Avalie diferentes aspectos da sua visita e deixe seus comentários"
      },
      ratings: {
        comida: "Qualidade da Comida",
        atencion: "Atendimento da Equipe",
        precio: "Custo-Benefício",
        estrellas: "{n}/5 estrelas"
      },
      comentarios: {
        titulo: "Comentários adicionais",
        placeholder: "Algo que gostaria de nos dizer sobre sua experiência? (Máx. 200 caracteres)",
        contador: "{n}/200 caracteres"
      },
      enviar: "Enviar Pesquisa",
      confirmacion: "Obrigado pela sua opinião! Sua pesquisa foi enviada.",
      errores: {
        login: "Você deve entrar para enviar uma pesquisa",
        envio: "Houve um problema ao enviar sua pesquisa. Por favor, tente novamente.",
        header: "Erro",
        ok: "OK"
      }
    },

    fr: {
      header: "Enquête",
      headerSection: {
        titulo: "Comment s’est passée votre expérience ?",
        subtitulo: "Évaluez différents aspects de votre visite et laissez-nous vos commentaires"
      },
      ratings: {
        comida: "Qualité de la Nourriture",
        atencion: "Service du Personnel",
        precio: "Rapport Qualité-Prix",
        estrellas: "{n}/5 étoiles"
      },
      comentarios: {
        titulo: "Commentaires supplémentaires",
        placeholder: "Quelque chose à nous dire sur votre expérience ? (Max. 200 caractères)",
        contador: "{n}/200 caractères"
      },
      enviar: "Envoyer l’Enquête",
      confirmacion: "Merci pour votre avis ! Votre enquête a été envoyée.",
      errores: {
        login: "Vous devez vous connecter pour envoyer une enquête",
        envio: "Un problème est survenu lors de l’envoi de votre enquête. Veuillez réessayer.",
        header: "Erreur",
        ok: "OK"
      }
    },

    de: {
      header: "Umfrage",
      headerSection: {
        titulo: "Wie war Ihre Erfahrung?",
        subtitulo: "Bewerten Sie verschiedene Aspekte Ihres Besuchs und hinterlassen Sie uns Ihre Kommentare"
      },
      ratings: {
        comida: "Qualität des Essens",
        atencion: "Service des Personals",
        precio: "Preis-Leistungs-Verhältnis",
        estrellas: "{n}/5 Sterne"
      },
      comentarios: {
        titulo: "Zusätzliche Kommentare",
        placeholder: "Möchten Sie uns etwas über Ihre Erfahrung mitteilen? (Max. 200 Zeichen)",
        contador: "{n}/200 Zeichen"
      },
      enviar: "Umfrage absenden",
      confirmacion: "Danke für Ihr Feedback! Ihre Umfrage wurde gesendet.",
      errores: {
        login: "Sie müssen sich anmelden, um eine Umfrage zu senden",
        envio: "Beim Senden der Umfrage ist ein Problem aufgetreten. Bitte versuchen Sie es erneut.",
        header: "Fehler",
        ok: "OK"
      }
    },

    ru: {
      header: "Опрос",
      headerSection: {
        titulo: "Как прошёл ваш визит?",
        subtitulo: "Оцените разные аспекты вашего визита и оставьте комментарии"
      },
      ratings: {
        comida: "Качество еды",
        atencion: "Обслуживание персонала",
        precio: "Соотношение цена-качество",
        estrellas: "{n}/5 звезд"
      },
      comentarios: {
        titulo: "Дополнительные комментарии",
        placeholder: "Хотите рассказать нам что-то о своём опыте? (Макс. 200 символов)",
        contador: "{n}/200 символов"
      },
      enviar: "Отправить опрос",
      confirmacion: "Спасибо за ваш отзыв! Ваш опрос был отправлен.",
      errores: {
        login: "Вы должны войти, чтобы отправить опрос",
        envio: "Произошла ошибка при отправке опроса. Пожалуйста, попробуйте снова.",
        header: "Ошибка",
        ok: "OK"
      }
    },

    ja: {
      header: "アンケート",
      headerSection: {
        titulo: "体験はいかがでしたか？",
        subtitulo: "訪問のさまざまな側面を評価して、コメントを残してください"
      },
      ratings: {
        comida: "料理の質",
        atencion: "スタッフの対応",
        precio: "コストパフォーマンス",
        estrellas: "{n}/5 星"
      },
      comentarios: {
        titulo: "追加のコメント",
        placeholder: "体験について何か伝えたいことはありますか？（最大200文字）",
        contador: "{n}/200 文字"
      },
      enviar: "アンケートを送信",
      confirmacion: "ご意見ありがとうございます！アンケートが送信されました。",
      errores: {
        login: "アンケートを送信するにはログインが必要です",
        envio: "アンケートの送信中に問題が発生しました。もう一度お試しください。",
        header: "エラー",
        ok: "OK"
      }
    }
  };
}