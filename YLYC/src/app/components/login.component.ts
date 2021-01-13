import { Component, ElementRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  form: FormGroup;
  errorMessage: string;

  constructor(private fb:FormBuilder, private router: Router, private authSvc: AuthService) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      user_id: this.fb.control(''),
      password: this.fb.control('')
    })
  }

  //Login
  performLogin() {
    this.authSvc.login(this.form.get('user_id').value, this.form.get('password').value)
      .then(data => {
          if(data)
            this.router.navigate(['/main']);
          else
            this.errorMessage = 'Invalid Login Credentials';
      }
    )
  }

}
