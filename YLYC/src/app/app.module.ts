import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LoginComponent } from './components/login.component';
import { RouterModule, Routes } from '@angular/router';
import { AuthService } from './services/auth.service';
import { HeaderComponent } from './header/header.component';
import { MainComponent } from './components/main.component';
import { WebNotificationService } from './services/web.notification.service';
import { AngularFireModule } from '@angular/fire';
import { AngularFireMessagingModule } from '@angular/fire/messaging';
import { SignupComponent } from './components/signup.component';
import { CustomvalidationService } from './services/customvalidation.service';
import { BackendService } from './services/backend.service';
import { WebcamModule } from 'ngx-webcam';
import { CaptureImageComponent } from './components/capture-image.component'
import { CameraService } from './services/camera.services';
import { HistoryComponent } from './components/history.component';
import { RedeemComponent } from './components/redeem.component';

const ROUTES: Routes = [
  { path: '', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'main', component: MainComponent, canActivate: [AuthService] },
  { path: 'history', component: HistoryComponent , canActivate: [AuthService]},
  { path: 'redeem', component: RedeemComponent , canActivate: [AuthService]},
  { path: 'capture/:rId', component: CaptureImageComponent ,canActivate: [AuthService] },
  { path: '**', redirectTo: '/', pathMatch: 'full' }
]

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HeaderComponent,
    MainComponent,
    SignupComponent,
    CaptureImageComponent,
    HistoryComponent,
    RedeemComponent
  ],
  imports: [
    BrowserModule,
    ServiceWorkerModule.register('combined-sw.js', { enabled: environment.production }),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forRoot(ROUTES, { useHash: true }),
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireMessagingModule,
    WebcamModule
  ],
  providers: [AuthService, WebNotificationService, CustomvalidationService, BackendService, CameraService],
  bootstrap: [AppComponent]
})
export class AppModule { }
