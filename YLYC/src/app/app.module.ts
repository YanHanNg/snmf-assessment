import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LoginComponent } from './components/login.component';
import { RouterModule, Routes } from '@angular/router';
import { AuthService } from './auth.service';
import { HeaderComponent } from './header/header.component';
import { MainComponent } from './components/main.component';
import { WebNotificationService } from './web.notification.service';
import { AngularFireModule } from '@angular/fire';
import { AngularFireMessagingModule } from '@angular/fire/messaging';
import { SignupComponent } from './components/signup.component';
import { CustomvalidationService } from './services/customvalidation.service';
import { BackendService } from './services/backend.service';

const ROUTES: Routes = [
  { path: '', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'main', component: MainComponent },
  { path: '**', redirectTo: '/', pathMatch: 'full' }
]

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HeaderComponent,
    MainComponent,
    SignupComponent
  ],
  imports: [
    BrowserModule,
    ServiceWorkerModule.register('combined-sw.js', { enabled: environment.production }),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forRoot(ROUTES),
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireMessagingModule
  ],
  providers: [AuthService, WebNotificationService, CustomvalidationService, BackendService],
  bootstrap: [AppComponent]
})
export class AppModule { }
