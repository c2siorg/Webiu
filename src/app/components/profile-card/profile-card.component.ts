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
  @Input()  contributor_name!: string;
  @Input() github_username!: string;
  @Input()  repos!: string[];
  @Input() avatar_url!:string;
  @Input() contributions!: string;
  @Input() followers!: string;
  @Input() followings!: string;

}