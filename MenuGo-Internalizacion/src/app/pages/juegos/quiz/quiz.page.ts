import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { addDoc, collection, collectionData, doc, Firestore, getDocs, orderBy, query, updateDoc, where } from '@angular/fire/firestore';
import {
  IonButton,
  IonBackButton,
  IonButtons,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  time,
  trophy,
  star,
  play,
  refresh,
  home,
  restaurant,
  checkmarkCircle,
  closeCircle,
  sad
} from 'ionicons/icons';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, Subscription } from 'rxjs';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { JuegosService } from 'src/app/services/juegos.service';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { MapaidiomaPage } from "../../mapaidioma/mapaidioma.page";
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.page.html',
  styleUrls: ['./quiz.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IMPORTS_IONIC, MapaidiomaPage]
})
export class QuizPage implements OnInit, OnDestroy {
  // Estados del juego: 'start', 'playing', 'results'
  gameState: string = 'start';
  preguntas: any[] = [];

  // Variables de juego
  currentQuestionIndex: number = 0;
  currentQuestion: any = null;
  selectedOption: number | null = null;
  isAnswered: boolean = false;
  isCorrect: boolean = false;
  feedbackMessage: string = '';
  score: number = 0;
  timeLeft: number = 15;
  timerProgress: number = 0;
  timerInterval: any;
  private preguntasSub!: Subscription;
  // Configuración
  totalQuestions: number = 10;
  timePerQuestion: number = 15;
  winThreshold: number = 8;
  discountCode: string = '';
  error: boolean = false;
  idJuego: string = "5l6XYagzQD0bR4VLvd2W";
  userData: any;
  primerIntento: boolean = true;
  gano: boolean = false;
  juegoIntentos: any;
  isLoading: boolean = false
  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);

  // Firebase
  preguntas$: Observable<any[]> | undefined;

  constructor(private firestore: Firestore, private juegosService: JuegosService, private authService: AuthService, private router: Router) {
    addIcons({
      time, trophy, star, play, refresh, home, restaurant,
      checkmarkCircle, closeCircle, sad
    });
  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  async enviarPreguntas(preguntas: any[]): Promise<void> {
    try {
      // 1) Referencia a la colección 'quiz'
      const quizCol = collection(this.firestore, 'quiz');

      // 2) Para cada pregunta, addDoc()
      for (const pregunta of preguntas) {
        const ref = await addDoc(quizCol, pregunta);
        console.log(`Pregunta enviada: "${pregunta.pregunta}" (ID=${ref.id})`);
      }

      console.log("✅ Todas las preguntas han sido enviadas a Firebase!");
    } catch (error) {
      console.error("❌ Error al enviar preguntas:", error);
      throw error;
    }
  }


  async ngOnInit() {
    // this.isLoading = true;
    this.userData = await this.authService.getUserData();

    // this.juegoIntentos = await this.juegosService.traerEstadoJuegoPedido(this.userData.id, this.idJuego);
    // this.primerIntento = this.juegoIntentos.primerIntento;
    // this.gano = this.juegoIntentos.gano;

    const col = collection(this.firestore, 'quiz');
    this.preguntas$ = collectionData(col, { idField: 'id' });
    this.preguntasSub = this.preguntas$.subscribe(questions => {
      if (questions?.length) {
        this.preguntas = questions;
        this.shuffleQuestions();
      }
      this.isLoading = false;
    });

    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  ngOnDestroy() {
    this.stopTimer();
    this.preguntasSub?.unsubscribe();
  }

  shuffleQuestions() {
    // Algoritmo Fisher-Yates para barajar preguntas
    for (let i = this.preguntas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.preguntas[i], this.preguntas[j]] = [this.preguntas[j], this.preguntas[i]];
    }
  }

  startGame() {
    this.gameState = 'playing';
    this.score = 0;
    this.currentQuestionIndex = 0;
    this.loadQuestion();
    this.startTimer();

    console.log(this.currentQuestion.respuesta);

  }

  loadQuestion() {
    this.currentQuestion = this.preguntas[this.currentQuestionIndex];
    this.selectedOption = null;
    this.isAnswered = false;
    this.timeLeft = this.timePerQuestion;
    this.timerProgress = 0;
  }

  startTimer() {
    this.stopTimer();

    this.timerInterval = setInterval(() => {
      this.timeLeft--;

      // Actualizar progreso del temporizador visual
      const progressPercent = (this.timeLeft / this.timePerQuestion) * 100;
      this.timerProgress = 189 * (progressPercent / 100); // 189 es la circunferencia completa

      if (this.timeLeft <= 0) {
        this.timeUp();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  timeUp() {
    this.stopTimer();
    this.isAnswered = true;
    this.isCorrect = false;
    this.feedbackMessage = this.textos[this.currentLang].game.timeUp;
  }

  selectOption(index: number) {
    this.stopTimer();
    this.selectedOption = index;
    this.isAnswered = true;

    const correctAnswer = this.currentQuestion.respuesta;
    this.isCorrect = (index === correctAnswer);

    if (this.isCorrect) {
      this.score++;
      this.feedbackMessage = this.textos[this.currentLang].game.correct;
    } else {
      const ansText = this.currentQuestion.opciones[correctAnswer];
      this.feedbackMessage = this.textos[this.currentLang].game.incorrectPrefix.replace('{ans}', ansText);
    }
  }

  nextQuestion() {
    this.currentQuestionIndex++;

    if (this.currentQuestionIndex < this.totalQuestions) {
      this.loadQuestion();
      this.startTimer();
    } else {
      this.endGame();
    }

    console.log(this.currentQuestion.respuesta);

  }

  endGame() {
    this.gameState = 'results';
    this.generateDiscountCode();
  }

  generateDiscountCode() {
    if (this.score >= this.winThreshold) {
      const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';

      for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters.charAt(randomIndex);
      }

      this.discountCode = `DESC-${code}`;

      if (this.primerIntento) {
        this.juegosService.actualizarEstadoJuegoPedido(this.userData.id, this.idJuego, true, false);
        this.gano = true;
      }
    } else {
      this.error = true;
      if (this.primerIntento) {
        this.juegosService.actualizarEstadoJuegoPedido(this.userData.id, this.idJuego, false, false);
      }
    }
  }

  restartGame() {
    this.gameState = 'start';
    this.shuffleQuestions();
    this.primerIntento = false;
  }

  async back() {
    console.log(this.gameState, this.primerIntento, this.gano);

    if (this.gameState == 'playing' && this.primerIntento == true && this.gano == false) {
      await this.juegosService.actualizarEstadoJuegoPedido(this.userData.id, this.idJuego, false, false);
    }
    this.router.navigate(["/menu-juegos"]);
  }

  textos: any = {
    es: {
      header: "Cuestionario del Restaurante",
      start: {
        title: "Cuestionario del Restaurante",
        subtitle: "Responde correctamente 10 preguntas sobre nuestro restaurante para ganar un descuento especial",
        timeInfo: "15 segundos por pregunta",
        discountInfo: "15% de descuento si ganas",
        startBtn: "Comenzar Cuestionario"
      },
      game: {
        timeUp: "¡Tiempo agotado!",
        correct: "¡Correcto!",
        incorrectPrefix: "Incorrecto. La respuesta era: {ans}",
        nextBtn: "Siguiente Pregunta",
        resultsBtn: "Ver Resultados",
        scoreOf: "{s}/{t}"
      },
      results: {
        winTitle: "¡Felicidades!",
        loseTitle: "¡Inténtalo de nuevo!",
        stats: {
          questions: "Preguntas",
          correct: "Correctas",
          percent: "Porcentaje"
        },
        winMsgs: {
          first: "¡Has ganado un descuento del 15%!",
          laterNoDiscount: "¡Has ganado! No tendrás descuento debido a que no ganaste en tu primer intento.",
          laterAlready: "¡Has ganado! Ya tienes un descuento aplicado por este juego."
        },
        loseMsgs: {
          need: "Necesitas al menos {n} respuestas correctas en tu primer intento para ganar el descuento.",
          consolation: "Pero no te preocupes, ya tenés tu descuento aplicado."
        },
        actions: {
          restart: "Jugar de nuevo",
          home: "Volver al inicio"
        }
      },
      loading: "Cargando preguntas..."
    },
    en: {
      header: "Restaurant Quiz",
      start: {
        title: "Restaurant Quiz",
        subtitle: "Answer 10 questions about our restaurant to win a special discount",
        timeInfo: "15 seconds per question",
        discountInfo: "15% discount if you win",
        startBtn: "Start Quiz"
      },
      game: {
        timeUp: "Time’s up!",
        correct: "Correct!",
        incorrectPrefix: "Incorrect. The answer was: {ans}",
        nextBtn: "Next Question",
        resultsBtn: "View Results",
        scoreOf: "{s}/{t}"
      },
      results: {
        winTitle: "Congratulations!",
        loseTitle: "Try again!",
        stats: {
          questions: "Questions",
          correct: "Correct",
          percent: "Percentage"
        },
        winMsgs: {
          first: "You’ve won a 15% discount!",
          laterNoDiscount: "You won! No discount this time since it wasn’t your first try.",
          laterAlready: "You won! A discount from this game is already applied."
        },
        loseMsgs: {
          need: "You need at least {n} correct answers on your first try to win the discount.",
          consolation: "Don’t worry, you already have a discount applied."
        },
        actions: {
          restart: "Play again",
          home: "Back to home"
        }
      },
      loading: "Loading questions..."
    },
    pt: {
      header: "Quiz do Restaurante",
      start: {
        title: "Quiz do Restaurante",
        subtitle: "Responda corretamente 10 perguntas sobre nosso restaurante para ganhar um desconto especial",
        timeInfo: "15 segundos por pergunta",
        discountInfo: "15% de desconto se vencer",
        startBtn: "Iniciar Quiz"
      },
      game: {
        timeUp: "Tempo esgotado!",
        correct: "Correto!",
        incorrectPrefix: "Incorreto. A resposta era: {ans}",
        nextBtn: "Próxima Pergunta",
        resultsBtn: "Ver Resultados",
        scoreOf: "{s}/{t}"
      },
      results: {
        winTitle: "Parabéns!",
        loseTitle: "Tente novamente!",
        stats: {
          questions: "Perguntas",
          correct: "Corretas",
          percent: "Porcentagem"
        },
        winMsgs: {
          first: "Você ganhou 15% de desconto!",
          laterNoDiscount: "Você venceu! Sem desconto desta vez, pois não foi na primeira tentativa.",
          laterAlready: "Você venceu! Um desconto deste jogo já está aplicado."
        },
        loseMsgs: {
          need: "Você precisa de pelo menos {n} acertos na primeira tentativa para ganhar o desconto.",
          consolation: "Não se preocupe, você já tem um desconto aplicado."
        },
        actions: {
          restart: "Jogar novamente",
          home: "Voltar ao início"
        }
      },
      loading: "Carregando perguntas..."
    },
    fr: {
      header: "Quiz du Restaurant",
      start: {
        title: "Quiz du Restaurant",
        subtitle: "Répondez correctement à 10 questions sur notre restaurant pour gagner une remise spéciale",
        timeInfo: "15 secondes par question",
        discountInfo: "15% de remise si vous gagnez",
        startBtn: "Commencer le Quiz"
      },
      game: {
        timeUp: "Temps écoulé !",
        correct: "Correct !",
        incorrectPrefix: "Incorrect. La réponse était : {ans}",
        nextBtn: "Question suivante",
        resultsBtn: "Voir les résultats",
        scoreOf: "{s}/{t}"
      },
      results: {
        winTitle: "Félicitations !",
        loseTitle: "Réessayez !",
        stats: {
          questions: "Questions",
          correct: "Correctes",
          percent: "Pourcentage"
        },
        winMsgs: {
          first: "Vous avez gagné 15% de remise !",
          laterNoDiscount: "Vous avez gagné ! Pas de remise cette fois car ce n’était pas votre premier essai.",
          laterAlready: "Vous avez gagné ! Une remise pour ce jeu est déjà appliquée."
        },
        loseMsgs: {
          need: "Il faut au moins {n} bonnes réponses au premier essai pour gagner la remise.",
          consolation: "Ne vous inquiétez pas, une remise est déjà appliquée."
        },
        actions: {
          restart: "Rejouer",
          home: "Retour à l’accueil"
        }
      },
      loading: "Chargement des questions…"
    },
    de: {
      header: "Restaurant-Quiz",
      start: {
        title: "Restaurant-Quiz",
        subtitle: "Beantworte 10 Fragen über unser Restaurant, um einen speziellen Rabatt zu gewinnen",
        timeInfo: "15 Sekunden pro Frage",
        discountInfo: "15% Rabatt, wenn du gewinnst",
        startBtn: "Quiz starten"
      },
      game: {
        timeUp: "Zeit abgelaufen!",
        correct: "Richtig!",
        incorrectPrefix: "Falsch. Die richtige Antwort war: {ans}",
        nextBtn: "Nächste Frage",
        resultsBtn: "Ergebnisse anzeigen",
        scoreOf: "{s}/{t}"
      },
      results: {
        winTitle: "Glückwunsch!",
        loseTitle: "Versuch’s nochmal!",
        stats: {
          questions: "Fragen",
          correct: "Richtige",
          percent: "Prozentsatz"
        },
        winMsgs: {
          first: "Du hast 15% Rabatt gewonnen!",
          laterNoDiscount: "Du hast gewonnen! Kein Rabatt, da es nicht dein erster Versuch war.",
          laterAlready: "Du hast gewonnen! Ein Rabatt aus diesem Spiel ist bereits angewendet."
        },
        loseMsgs: {
          need: "Du brauchst mindestens {n} richtige Antworten beim ersten Versuch, um den Rabatt zu erhalten.",
          consolation: "Keine Sorge, du hast bereits einen Rabatt."
        },
        actions: {
          restart: "Nochmal spielen",
          home: "Zur Startseite"
        }
      },
      loading: "Fragen werden geladen…"
    },
    ru: {
      header: "Ресторанная Викторина",
      start: {
        title: "Ресторанная Викторина",
        subtitle: "Ответьте правильно на 10 вопросов о нашем ресторане, чтобы получить специальную скидку",
        timeInfo: "15 секунд на вопрос",
        discountInfo: "15% скидка, если выиграете",
        startBtn: "Начать викторину"
      },
      game: {
        timeUp: "Время вышло!",
        correct: "Правильно!",
        incorrectPrefix: "Неправильно. Правильный ответ: {ans}",
        nextBtn: "Следующий вопрос",
        resultsBtn: "Посмотреть результаты",
        scoreOf: "{s}/{t}"
      },
      results: {
        winTitle: "Поздравляем!",
        loseTitle: "Попробуйте снова!",
        stats: {
          questions: "Вопросы",
          correct: "Правильные",
          percent: "Процент"
        },
        winMsgs: {
          first: "Вы выиграли скидку 15%!",
          laterNoDiscount: "Вы выиграли! Скидка не предоставляется, так как это была не первая попытка.",
          laterAlready: "Вы выиграли! Скидка за эту игру уже применена."
        },
        loseMsgs: {
          need: "Нужно как минимум {n} правильных ответов с первой попытки, чтобы получить скидку.",
          consolation: "Не волнуйтесь, у вас уже есть применённая скидка."
        },
        actions: {
          restart: "Играть снова",
          home: "На главную"
        }
      },
      loading: "Загрузка вопросов…"
    },
    ja: {
      header: "レストランクイズ",
      start: {
        title: "レストランクイズ",
        subtitle: "お店に関する10問に正解して、特別な割引をゲット！",
        timeInfo: "1問あたり15秒",
        discountInfo: "勝利で15%割引",
        startBtn: "クイズを始める"
      },
      game: {
        timeUp: "時間切れ！",
        correct: "正解！",
        incorrectPrefix: "不正解。正解は：{ans}",
        nextBtn: "次の問題",
        resultsBtn: "結果を見る",
        scoreOf: "{s}/{t}"
      },
      results: {
        winTitle: "おめでとう！",
        loseTitle: "もう一度挑戦！",
        stats: {
          questions: "問題数",
          correct: "正解数",
          percent: "正解率"
        },
        winMsgs: {
          first: "15%割引を獲得！",
          laterNoDiscount: "勝利！ただし初回ではないため割引は付きません。",
          laterAlready: "勝利！このゲームの割引はすでに適用済みです。"
        },
        loseMsgs: {
          need: "初回で少なくとも{n}問正解すると割引を獲得できます。",
          consolation: "ご安心を。すでに割引が適用されています。"
        },
        actions: {
          restart: "もう一度遊ぶ",
          home: "ホームへ戻る"
        }
      },
      loading: "問題を読み込み中…"
    }
  };
}