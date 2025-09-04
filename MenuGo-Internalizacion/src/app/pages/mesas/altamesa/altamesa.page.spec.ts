import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AltamesaPage } from './altamesa.page';

describe('AltamesaPage', () => {
  let component: AltamesaPage;
  let fixture: ComponentFixture<AltamesaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AltamesaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
