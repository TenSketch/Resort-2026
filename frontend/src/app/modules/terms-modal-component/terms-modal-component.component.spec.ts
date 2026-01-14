import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermsModalComponentComponent } from './terms-modal-component.component';

describe('TermsModalComponentComponent', () => {
  let component: TermsModalComponentComponent;
  let fixture: ComponentFixture<TermsModalComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TermsModalComponentComponent]
    });
    fixture = TestBed.createComponent(TermsModalComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
