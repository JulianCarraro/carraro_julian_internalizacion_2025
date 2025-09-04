import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListareservasPage } from './listareservas.page';

describe('ListareservasPage', () => {
  let component: ListareservasPage;
  let fixture: ComponentFixture<ListareservasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListareservasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
