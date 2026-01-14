import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SharedRoutingModule } from './shared-routing.module';

import { ConfirmationModalComponent } from '../shared/confirmation-modal/confirmation-modal.component';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { GalleryComponent } from './gallery/gallery.component';
import { SearchResortComponent } from './search-resort/search-resort.component';
import { SearchTentComponent } from './search-tent/search-tent.component';
import { SearchTouristSpotComponent } from './search-tourist-spot/search-tourist-spot.component';
import { TouristSpotSelectionComponent } from './tourist-spot-selection/tourist-spot-selection.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // Import FormsModule and ReactiveFormsModule
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {MatButtonModule} from '@angular/material/button';

// Import ng-gallery modules
import { GalleryModule } from 'ng-gallery';
import { LightboxModule } from 'ng-gallery/lightbox';

@NgModule({
  declarations: [
    ConfirmationModalComponent,
    BreadcrumbsComponent,
    GalleryComponent,
    SearchResortComponent,
    SearchTentComponent,
    SearchTouristSpotComponent,
    TouristSpotSelectionComponent,
  ],
  imports: [
    CommonModule,
    SharedRoutingModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    GalleryModule,
    LightboxModule
  ],
  exports: [GalleryComponent, SearchResortComponent, SearchTentComponent, SearchTouristSpotComponent, TouristSpotSelectionComponent, GalleryModule, LightboxModule],
})
export class SharedModule {}
