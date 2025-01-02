import { Component, Input } from '@angular/core';
import { Alert } from '../../interfaces/alert';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css'],
  imports: [CommonModule],
})
export class AlertComponent {
  @Input() alerts: Alert[] = [];

  closeAlert(id: number): void {
    const index = this.alerts.findIndex((alert) => alert.id === id);
    if (index !== -1) {
      this.alerts.splice(index, 1); // Remove the alert by ID
    }
  }
}
