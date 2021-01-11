import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BackendService } from '../services/backend.service';
import { CustomvalidationService } from '../services/customvalidation.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

  form: FormGroup;
  submitted = false;
  errorMessage: string;

  constructor(private fb: FormBuilder, private customValidator: CustomvalidationService, private backendSvc: BackendService, private router: Router) {
    this.form = this.fb.group({
      name: this.fb.control('', [Validators.required]),
      user_id: this.fb.control('', [Validators.required, this.customValidator.userIdValidator]),
      email: this.fb.control('', [Validators.required, Validators.email]),
      password: this.fb.control('', [Validators.required]),
      confirm_password: this.fb.control('', [Validators.required])
    },
    {
      validator: this.customValidator.MatchPassword('password', 'confirm_password'),
    })
   }

  ngOnInit(): void {
  }

  get registerFormControl() {
    return this.form.controls;
  }

  signUp() {
    this.submitted = true;
    this.backendSvc.userSignUp(this.form.value)
      .subscribe( resp => {
        console.info(resp);
        if(resp.status == 201)
          this.router.navigate(['/']);
        else
          this.errorMessage = "Error Occurred. Please try again!"
      },
      err => {
        this.errorMessage = "Error Occurred. Please try again!"
      })
  }
}
