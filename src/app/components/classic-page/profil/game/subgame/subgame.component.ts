import { Component, Input, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameHistoryPlayerModel, GameOutcome } from 'src/app/models/game';
import { IconComponent } from 'src/app/shared/components/icon/icon.component';
import { FormatNumberPipe } from 'src/app/shared/pipes/format-number.pipe';

@Component({
  selector: 'app-subgame',
  imports: [FormatNumberPipe, IconComponent],
  templateUrl: './subgame.component.html',
  styleUrls: ['./subgame.component.scss'],
})
export class SubgameComponent implements OnInit {
  private router = inject(Router);

  @Input() gameHistoryPlayer: GameHistoryPlayerModel | null = null;
  @Input() outcome: GameOutcome | null = null;
  @Input() ranked_points: number | null = null;
  @Input() otherPlayer = false;

  modifiedGameHistoryPlayer: any;

  ngOnInit(): void {
    this.modifiedGameHistoryPlayer = {
      id: this.gameHistoryPlayer?.id || '--',
      day: this.gameHistoryPlayer?.day || '--',
      defense: this.gameHistoryPlayer?.defense || '--',
      username: this.gameHistoryPlayer?.username || '--',
      // ranked_points est la valeur absolue de la variation : le signe vient de l'issue
      ranked_points:
        this.ranked_points === null || this.outcome === null
          ? '--'
          : this.outcome === 'loss' && this.ranked_points > 0
            ? '-' + this.ranked_points
            : this.ranked_points,
    };
  }

  goToProfil(user_id: string) {
    this.router.navigate(['profil'], { queryParams: { user_id } });
  }
}
