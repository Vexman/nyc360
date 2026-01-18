import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {

}
