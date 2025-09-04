import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { addIcons } from 'ionicons';
import {
  trendingUpOutline,
  restaurantOutline,
  play,
  timeOutline,
  trophyOutline,
  pricetagOutline,
  peopleOutline
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { MapaidiomaPage } from "../../mapaidioma/mapaidioma.page";
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-menu-juegos',
  templateUrl: './menu-juegos.page.html',
  styleUrls: ['./menu-juegos.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IMPORTS_IONIC, MapaidiomaPage]
})
export class MenuJuegosPage implements OnInit {

  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);

  constructor(private router: Router) {
    addIcons({
      trendingUpOutline,
      restaurantOutline,
      play,
      timeOutline,
      trophyOutline,
      pricetagOutline,
      peopleOutline
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

  async back() {
    this.router.navigate(["/local"]);
  }

  mayorMenor() {
    this.router.navigate(["/mayor-menor"]);
  }

  quiz() {
    this.router.navigate(["/quiz"]);
  }

  textos: any = {
    es: {
      header: "Juegos del Restaurante",
      title: "¡Gana descuentos jugando!",
      games: {
        mayorMenor: {
          title: "Mayor o Menor",
          fast: "Rápido",
          discount: "10% descuento",
          playNow: "Jugar ahora"
        },
        quiz: {
          title: "Cuestionario del Restaurante",
          fast: "15 seg/preg",
          discount: "15% descuento",
          playNow: "Jugar ahora"
        }
      }
    },
    en: {
      header: "Restaurant Games",
      title: "Win discounts by playing!",
      games: {
        mayorMenor: {
          title: "Higher or Lower",
          fast: "Fast",
          discount: "10% discount",
          playNow: "Play now"
        },
        quiz: {
          title: "Restaurant Quiz",
          fast: "15 sec/question",
          discount: "15% discount",
          playNow: "Play now"
        }
      }
    },
    pt: {
      header: "Jogos do Restaurante",
      title: "Ganhe descontos jogando!",
      games: {
        mayorMenor: {
          title: "Maior ou Menor",
          fast: "Rápido",
          discount: "10% de desconto",
          playNow: "Jogar agora"
        },
        quiz: {
          title: "Quiz do Restaurante",
          fast: "15 seg/pergunta",
          discount: "15% de desconto",
          playNow: "Jogar agora"
        }
      }
    },
    fr: {
      header: "Jeux du Restaurant",
      title: "Gagnez des réductions en jouant !",
      games: {
        mayorMenor: {
          title: "Plus ou Moins",
          fast: "Rapide",
          discount: "10% de réduction",
          playNow: "Jouer maintenant"
        },
        quiz: {
          title: "Quiz du Restaurant",
          fast: "15 s/question",
          discount: "15% de réduction",
          playNow: "Jouer maintenant"
        }
      }
    },
    de: {
      header: "Restaurant-Spiele",
      title: "Gewinne Rabatte beim Spielen!",
      games: {
        mayorMenor: {
          title: "Höher oder Niedriger",
          fast: "Schnell",
          discount: "10% Rabatt",
          playNow: "Jetzt spielen"
        },
        quiz: {
          title: "Restaurant-Quiz",
          fast: "15 Sek./Frage",
          discount: "15% Rabatt",
          playNow: "Jetzt spielen"
        }
      }
    },
    ru: {
      header: "Игры ресторана",
      title: "Выигрывай скидки, играя!",
      games: {
        mayorMenor: {
          title: "Больше или Меньше",
          fast: "Быстро",
          discount: "Скидка 10%",
          playNow: "Играть сейчас"
        },
        quiz: {
          title: "Викторина о ресторане",
          fast: "15 сек/вопрос",
          discount: "Скидка 15%",
          playNow: "Играть сейчас"
        }
      }
    },
    ja: {
      header: "レストランゲーム",
      title: "遊んで割引をゲット！",
      games: {
        mayorMenor: {
          title: "ハイアンドロー",
          fast: "スピード",
          discount: "10%割引",
          playNow: "今すぐプレイ"
        },
        quiz: {
          title: "レストランクイズ",
          fast: "15秒/質問",
          discount: "15%割引",
          playNow: "今すぐプレイ"
        }
      }
    }
  };
}
