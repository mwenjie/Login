import { Component, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../services/notification.service';
import { Advertisement } from '../../models/advertisement.model';
import { MatDialog } from '@angular/material/dialog';
import { interval } from "rxjs";
import { ConfigureAlertDialogComponent } from './config-alert.component';
import { switchMap, concatMap, map, flatMap, tap } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';


@Component({
  selector: 'app-fetch-data',
  templateUrl: './fetch-data.component.html',
  styleUrls: ['./fetch-data.component.css']
})
export class FetchDataComponent {

  private name: string;
  public advertisements: Advertisement;
  displayedColumns: string[] = ['subject'];
  notifications: Notification[] = [];
  load$ = new BehaviorSubject('');

  // when OnDestroy is called.
  constructor(
    http: HttpClient,
    @Inject('BASE_URL') baseUrl: string,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {

    const notification$ = this.load$.pipe(
      switchMap(_ =>
        this.notificationService.countNotification().pipe(
          tap(result => this.notifications = result)
          , flatMap(notifications => notifications)
          , flatMap(
            (e) => interval(this.notificationService.calculateInterval(e.frequency)).pipe(map(o => e.subject)))
        )
      ));

    notification$.subscribe(r => console.log(r));
 
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(ConfigureAlertDialogComponent, {
      width: '450px',
      data: { name: this.name }
    });

    dialogRef.afterClosed().pipe(
      concatMap(result => {
        return this.notificationService.countNotification()
      })
    ).subscribe(data => this.notifications = data);

  }

  editNotification(notification: Notification) {

    const dialogRef = this.dialog.open(ConfigureAlertDialogComponent, {
      width: '450px',
      data: {
        id: notification.id,
        subject: notification.subject,
        url: notification.url,
        email: notification.email,
        frequency: notification.frequency,
        min: notification.min,
        max: notification.max
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.load$.next('');
    });
  }

  deleteNotification(notification: Notification) {

    this.notificationService.deleteNotification(notification.id).pipe(
      concatMap(result => {
        return this.notificationService.countNotification()
      })
    ).subscribe(data => this.notifications = data);
  }




}

