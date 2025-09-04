import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Idioma = 'es' | 'en' | 'pt' | 'fr' | 'de' | 'ru' | 'ja';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private defaultLang: Idioma = 'es';

  private languageSubject = new BehaviorSubject<Idioma>(
    (localStorage.getItem('lang') as Idioma) || this.defaultLang
  );
  language$ = this.languageSubject.asObservable();

  changeLanguage(language: Idioma) {
    this.languageSubject.next(language);
    localStorage.setItem('lang', language); // persistir
  }

  getCurrentLang(): Idioma {
    return this.languageSubject.value;
  }
}
