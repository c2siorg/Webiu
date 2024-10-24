import { CommonModule } from "@angular/common";
import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-card.component.html',
  styleUrls: ['./profile-card.component.scss'],
})
export class ProfileCardComponent {
  @Input() login!: string;
  @Input() repos!: string[];
  @Input() avatar_url!: string;
  @Input() contributions!: number;
  @Input() followers!: number;
  @Input() following!: number;

  @Output() contributionsClick = new EventEmitter<string>(); // Emit login when contributions are clicked

  onContributionsClick() {
    this.contributionsClick.emit(this.login); // Emit the login to parent component
  }
}
