import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { ModalController } from '@ionic/angular/standalone';
import { MapaidiomaPage } from "../../mapaidioma/mapaidioma.page";
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-resultado-modal',
  templateUrl: './resultado-modal.component.html',
  styleUrls: ['./resultado-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IMPORTS_IONIC, MapaidiomaPage]
})
export class ResultadoModalComponent {
  @Input() cartaAnterior!: number;
  @Input() siguienteCarta!: number;
  @Input() opcion!: string;

  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);

  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {
    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  getResultado(): string {
    console.log(this.cartaAnterior, "cartaAnterior");

    if (this.opcion === 'mayor') {
      return this.siguienteCarta > this.cartaAnterior ? 'correcta' : 'incorrecta';
    } else {
      return this.siguienteCarta < this.cartaAnterior ? 'correcta' : 'incorrecta';
    }
  }

  getMensaje(): string {
    const resultado = this.getResultado();
    console.log(resultado);

    if (resultado === 'correcta') {
      return this.textos[this.currentLang].correctChoice;
    } else {
      return this.textos[this.currentLang].incorrectChoice;
    }
  }

  textos: any = {
    es: {
      header: "Resultado",
      correctChoice: "¡Tu elección fue correcta!",
      incorrectChoice: "¡Tu elección fue incorrecta!",
      previousCard: "Carta anterior",
      nextCard: "Siguiente carta",
      yourChoice: "Tu elección:",
      higher: "Mayor",
      lower: "Menor",
      explanation: {
        correct: "¡Bien hecho! Elegiste correctamente.",
        incorrect: "La carta siguiente era {comp} que {prev}."
      },
      continue: "Continuar"
    },
    en: {
      header: "Result",
      correctChoice: "Your choice was correct!",
      incorrectChoice: "Your choice was incorrect!",
      previousCard: "Previous card",
      nextCard: "Next card",
      yourChoice: "Your choice:",
      higher: "Higher",
      lower: "Lower",
      explanation: {
        correct: "Well done! You chose correctly.",
        incorrect: "The next card was {comp} than {prev}."
      },
      continue: "Continue"
    },
    pt: {
      header: "Resultado",
      correctChoice: "Sua escolha foi correta!",
      incorrectChoice: "Sua escolha foi incorreta!",
      previousCard: "Carta anterior",
      nextCard: "Próxima carta",
      yourChoice: "Sua escolha:",
      higher: "Maior",
      lower: "Menor",
      explanation: {
        correct: "Muito bem! Você escolheu corretamente.",
        incorrect: "A próxima carta era {comp} que {prev}."
      },
      continue: "Continuar"
    },
    fr: {
      header: "Résultat",
      correctChoice: "Votre choix était correct !",
      incorrectChoice: "Votre choix était incorrect !",
      previousCard: "Carte précédente",
      nextCard: "Carte suivante",
      yourChoice: "Votre choix :",
      higher: "Plus",
      lower: "Moins",
      explanation: {
        correct: "Bien joué ! Vous avez choisi correctement.",
        incorrect: "La carte suivante était {comp} que {prev}."
      },
      continue: "Continuer"
    },
    de: {
      header: "Ergebnis",
      correctChoice: "Deine Wahl war richtig!",
      incorrectChoice: "Deine Wahl war falsch!",
      previousCard: "Vorherige Karte",
      nextCard: "Nächste Karte",
      yourChoice: "Deine Wahl:",
      higher: "Höher",
      lower: "Niedriger",
      explanation: {
        correct: "Gut gemacht! Du hast richtig gewählt.",
        incorrect: "Die nächste Karte war {comp} als {prev}."
      },
      continue: "Weiter"
    },
    ru: {
      header: "Результат",
      correctChoice: "Ваш выбор был правильным!",
      incorrectChoice: "Ваш выбор был неправильным!",
      previousCard: "Предыдущая карта",
      nextCard: "Следующая карта",
      yourChoice: "Ваш выбор:",
      higher: "Больше",
      lower: "Меньше",
      explanation: {
        correct: "Молодец! Вы выбрали правильно.",
        incorrect: "Следующая карта была {comp}, чем {prev}."
      },
      continue: "Продолжить"
    },
    ja: {
      header: "結果",
      correctChoice: "あなたの選択は正解です！",
      incorrectChoice: "あなたの選択は不正解です！",
      previousCard: "前のカード",
      nextCard: "次のカード",
      yourChoice: "あなたの選択:",
      higher: "大きい",
      lower: "小さい",
      explanation: {
        correct: "よくできました！正しく選びました。",
        incorrect: "次のカードは {prev} より {comp} でした。"
      },
      continue: "続ける"
    }
  };
}