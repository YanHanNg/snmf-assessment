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

const ROUTES: Routes = [
  { path: '', component: LoginComponent },
  { path: 'main', component: MainComponent },
  { path: '**', redirectTo: '/', pathMatch: 'full' }
]

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HeaderComponent,
    MainComponent
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
  providers: [AuthService, WebNotificationService],
  bootstrap: [AppComponent]
})
export class AppModule { }
