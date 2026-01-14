import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowSuccessMessageComponent } from './show-success-message.component';

describe('ShowSuccessMessageComponent', () => {
  let component: ShowSuccessMessageComponent;
  let fixture: ComponentFixture<ShowSuccessMessageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ShowSuccessMessageComponent]
    });
    fixture = TestBed.createComponent(ShowSuccessMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
