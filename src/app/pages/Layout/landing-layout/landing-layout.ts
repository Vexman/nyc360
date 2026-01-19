import { Component } from '@angular/core';
import { FooterComponent } from "../../Public/Widgets/footer/footer.component";
import { RouterOutlet } from "@angular/router";
import { NavBarComponent } from "../../landing/Widgets/nav-bar/nav-bar.component";
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-landing-layout',
  imports: [FooterComponent, RouterOutlet, NavBarComponent, ToastComponent],
  templateUrl: './landing-layout.html',
  styleUrl: './landing-layout.scss',
})
export class LandingLayout {

}
