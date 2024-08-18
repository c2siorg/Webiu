import { CommonModule } from "@angular/common";
import { Component , Input } from "@angular/core";

@Component({
    selector: 'app-profile-card',
    standalone:true,
    imports:[CommonModule],
    templateUrl:'./profile-card.component.html',
    styleUrl:'./profile-card.component.scss',
})
export class ProfileCardComponent{
  @Input()  login!: string;
  @Input()  repos!: string[];
  @Input() avatar_url!:string;
  @Input() contributions!: number;
  @Input() followers!: number;
  @Input() following!: number;

}