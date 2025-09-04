import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, AlertController } from '@ionic/angular/standalone';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { addIcons } from 'ionicons';
import { arrowDown, arrowUp, play, refresh, trophy, closeCircleOutline } from 'ionicons/icons';
import { JuegosService } from 'src/app/services/juegos.service';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { MapaidiomaPage } from "../../mapaidioma/mapaidioma.page";
import { LanguageService } from 'src/app/services/language.service';


@Component({
  selector: 'app-mayor-menor',
  templateUrl: './mayor-menor.page.html',
  styleUrls: ['./mayor-menor.page.scss'],
  standalone: true,
  imports: [CommonModule, IMPORTS_IONIC, MapaidiomaPage]
})
export class MayorMenorPage implements OnInit {
  userData: any;
  cartaActual: number = 0;
  siguienteCarta: number = 0;
  aciertos: number = 0;
  juegoActivo: boolean = false;
  descuentoGenerado: boolean = false;
  codigoDescuento: string = '';
  historial: string[] = [];
  juegoCompletado: boolean = false;
  error: boolean = false;
  juegoIntentos: any = [];
  primerIntento: boolean = true;
  gano: boolean = false;
  juegoId = "vDBryNGhFmG0785miL5w";
  isLoading = false;
  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);

  constructor(
    private juegosService: JuegosService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ arrowDown, arrowUp, refresh, trophy, play, closeCircleOutline });
  }

  async ngOnInit() {
    // this.isLoading = true;
    this.userData = await this.authService.getUserData();
    this.juegoIntentos = await this.juegosService.traerEstadoJuegoPedido(this.userData.id, this.juegoId);
    console.log(this.juegoIntentos);

    this.primerIntento = this.juegoIntentos.primerIntento;
    this.gano = this.juegoIntentos.gano;
    addIcons({ trophy, play, refresh, arrowDown, arrowUp, closeCircleOutline })
    this.iniciarJuego();
    this.isLoading = false;

    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
      console.log("this.currentLang", this.currentLang)
    });
  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  iniciarJuego(ganoPerdio?: number) {
    this.cartaActual = this.generarCartaAleatoria();
    this.siguienteCarta = this.generarCartaAleatoria();

    console.log(this.cartaActual);
    console.log(this.siguienteCarta);

    this.aciertos = 0;
    this.juegoActivo = true;
    this.descuentoGenerado = false;
    this.error = false;
    this.juegoCompletado = false;
    this.historial = [];

    if (ganoPerdio == 1) {
      this.primerIntento = false;
    }
    // this.agregarAlHistorial(`Juego iniciado. Carta inicial: ${this.cartaActual}`);
  }

  generarCartaAleatoria(): number {
    let carta = Math.floor(Math.random() * 13) + 1;

    while (carta == this.cartaActual)
      carta = Math.floor(Math.random() * 13) + 1;

    return carta; // 1-13 (As=1, J=11, Q=12, K=13)
  }

  async seleccionar(opcion: 'mayor' | 'menor') {
    if (!this.juegoActivo) return;

    const cartaAnterior = this.cartaActual;
    this.cartaActual = this.siguienteCarta;
    this.siguienteCarta = this.generarCartaAleatoria();
    console.log(this.siguienteCarta);


    const resultado = this.verificarResultado(cartaAnterior, this.cartaActual, opcion);
    const accion = opcion === 'mayor' ? 'mayor' : 'menor';

    if (resultado) {
      this.aciertos++;
      // this.agregarAlHistorial(`✅ Adivinaste! ${cartaAnterior} es ${accion} que ${this.cartaActual}`);

      if (this.aciertos >= 5) {
        this.juegoCompletado = true;
        this.generarDescuento();
      }
    } else {
      // this.agregarAlHistorial(`❌ Fallaste! ${cartaAnterior} no es ${accion} que ${this.cartaActual}`);
      this.mostrarMensajeFallido();
      console.log("muestro mensaje");

    }
  }

  verificarResultado(anterior: number, actual: number, opcion: 'mayor' | 'menor'): boolean {
    if (opcion === 'mayor') {
      return actual > anterior;
    } else {
      return actual < anterior;
    }
  }

  async generarDescuento() {
    this.juegoActivo = false;
    this.descuentoGenerado = true;

    // Generar un código de descuento aleatorio
    // const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    // let codigo = '';
    // for (let i = 0; i < 8; i++) {
    //   codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    // }
    // this.codigoDescuento = codigo;
    if (this.primerIntento == true) {
      this.juegosService.actualizarEstadoJuegoPedido(this.userData.id, this.juegoId, true, false);
      this.gano = true;
    }

    // const alert = await this.alertController.create({
    //   header: '¡Felicidades!',
    //   message: `Has ganado un 10% de descuento en tu próxima compra.<br><br><strong>Código: ${codigo}</strong>`,
    //   buttons: ['Aceptar']
    // });

    // await alert.present();
    // this.agregarAlHistorial('🎉 ¡Ganaste un descuento del 10%!');
  }

  async mostrarMensajeFallido() {
    this.aciertos = 0;

    this.error = true;
    if (this.primerIntento == true) {
      this.juegosService.actualizarEstadoJuegoPedido(this.userData.id, this.juegoId, false, false);
    }

    // const alert = await this.alertController.create({
    //   header: 'Inténtalo de nuevo',
    //   message: 'No acertaste. ¡Sigue intentando para ganar un descuento!',
    //   buttons: ['Continuar']
    // });

    // await alert.present();
  }
  async back() {
    if (this.primerIntento == true && this.gano == false) {
      await this.juegosService.actualizarEstadoJuegoPedido(this.userData.id, this.juegoId, false, false);
    }
    this.router.navigate(["/menu-juegos"]);
  }

  // agregarAlHistorial(mensaje: string) {
  //   this.historial.unshift(mensaje);
  //   // Mantener solo los últimos 5 mensajes
  //   if (this.historial.length > 5) {
  //     this.historial.pop();
  //   }
  // }

  textos: any = {
    es: {
      header: "Gana un Descuento",
      game: {
        title: "¿Mayor o Menor?",
        subtitle: "Adivina 5 veces seguidas para ganar un descuento",
        progress: "{n}/5 aciertos",
        currentCard: "Carta actual",
        nextCard: "Siguiente carta",
        lower: "Menor",
        higher: "Mayor",
        playAgain: "Jugar de nuevo"
      },
      win: {
        title: "¡Felicidades!",
        discount10: "Ganaste un descuento del 10%",
        wow: "¡WOW! 🔮 ¡Sos un adivino!"
      },
      lose: {
        title: "Inténtalo de nuevo",
        text: "No acertaste ¡Seguí intentando!",
        theCardWas: "La carta era:",
        noFirstTry: "No obtendrás descuento ya que no ganaste en el primer intento."
      }
    },
    en: {
      header: "Win a Discount",
      game: {
        title: "Higher or Lower?",
        subtitle: "Guess 5 times in a row to win a discount",
        progress: "{n}/5 hits",
        currentCard: "Current card",
        nextCard: "Next card",
        lower: "Lower",
        higher: "Higher",
        playAgain: "Play again"
      },
      win: {
        title: "Congratulations!",
        discount10: "You won a 10% discount",
        wow: "WOW! 🔮 You're a mind reader!"
      },
      lose: {
        title: "Try again",
        text: "Wrong guess. Keep trying!",
        theCardWas: "The card was:",
        noFirstTry: "You won’t get a discount since you didn’t win on the first try."
      }
    },
    pt: {
      header: "Ganhe um Desconto",
      game: {
        title: "Maior ou Menor?",
        subtitle: "Acerte 5 vezes seguidas para ganhar um desconto",
        progress: "{n}/5 acertos",
        currentCard: "Carta atual",
        nextCard: "Próxima carta",
        lower: "Menor",
        higher: "Maior",
        playAgain: "Jogar novamente"
      },
      win: {
        title: "Parabéns!",
        discount10: "Você ganhou 10% de desconto",
        wow: "Uau! 🔮 Você é vidente!"
      },
      lose: {
        title: "Tente novamente",
        text: "Não acertou. Continue tentando!",
        theCardWas: "A carta era:",
        noFirstTry: "Você não ganhará desconto pois não venceu na primeira tentativa."
      }
    },
    fr: {
      header: "Gagnez une Remise",
      game: {
        title: "Plus ou Moins ?",
        subtitle: "Devinez 5 fois d’affilée pour gagner une remise",
        progress: "{n}/5 réussites",
        currentCard: "Carte actuelle",
        nextCard: "Carte suivante",
        lower: "Moins",
        higher: "Plus",
        playAgain: "Rejouer"
      },
      win: {
        title: "Félicitations !",
        discount10: "Vous avez gagné 10% de remise",
        wow: "WOW ! 🔮 Voyant !"
      },
      lose: {
        title: "Réessayez",
        text: "Mauvaise réponse. Continuez à essayer !",
        theCardWas: "La carte était :",
        noFirstTry: "Pas de remise car vous n’avez pas gagné du premier coup."
      }
    },
    de: {
      header: "Gewinne einen Rabatt",
      game: {
        title: "Höher oder Niedriger?",
        subtitle: "Errate 5-mal hintereinander und gewinne einen Rabatt",
        progress: "{n}/5 Treffer",
        currentCard: "Aktuelle Karte",
        nextCard: "Nächste Karte",
        lower: "Niedriger",
        higher: "Höher",
        playAgain: "Nochmal spielen"
      },
      win: {
        title: "Glückwunsch!",
        discount10: "Du hast 10% Rabatt gewonnen",
        wow: "WOW! 🔮 Gedankenleser!"
      },
      lose: {
        title: "Versuch’s nochmal",
        text: "Falsch geraten. Weiter versuchen!",
        theCardWas: "Die Karte war:",
        noFirstTry: "Kein Rabatt, da du nicht beim ersten Versuch gewonnen hast."
      }
    },
    ru: {
      header: "Выиграй скидку",
      game: {
        title: "Больше или меньше?",
        subtitle: "Угадайте 5 раз подряд, чтобы получить скидку",
        progress: "{n}/5 удачных попыток",
        currentCard: "Текущая карта",
        nextCard: "Следующая карта",
        lower: "Меньше",
        higher: "Больше",
        playAgain: "Играть снова"
      },
      win: {
        title: "Поздравляем!",
        discount10: "Вы выиграли скидку 10%",
        wow: "Вау! 🔮 Вы читаете мысли!"
      },
      lose: {
        title: "Попробуйте снова",
        text: "Не угадали. Продолжайте пробовать!",
        theCardWas: "Это была карта:",
        noFirstTry: "Скидка не предоставляется, если вы не выиграли с первой попытки."
      }
    },
    ja: {
      header: "割引をゲット",
      game: {
        title: "ハイアンドロー？",
        subtitle: "5回連続で当てると割引を獲得",
        progress: "{n}/5 回成功",
        currentCard: "現在のカード",
        nextCard: "次のカード",
        lower: "低い",
        higher: "高い",
        playAgain: "もう一度プレイ"
      },
      win: {
        title: "おめでとうございます！",
        discount10: "10%割引を獲得しました",
        wow: "すごい！🔮 エスパー級！"
      },
      lose: {
        title: "もう一度挑戦",
        text: "ハズレ。まだまだいける！",
        theCardWas: "カードはこれ：",
        noFirstTry: "初回で勝利していないため割引は適用されません。"
      }
    }
  };
}