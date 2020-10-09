import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { tokenDictionary } from '../../../assets/token.dictionary';
import { Token } from '../../services/state/pool.store';


@Component({
  selector: '[control] app-token',
  templateUrl: 'token.component.html',
  styleUrls: ['./token.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TokenComponent implements OnInit {
  @Input() control: FormControl;
  @Input() label = 'ERC20 Token';

  public tokens$: Observable<Token[]>;

  public tokens: Token[];

  async ngOnInit() {
    this.tokens = tokenDictionary.homestead;
    this.tokens$ = this.control.valueChanges.pipe(
      startWith(''),
      map(state => state ? this.filterTokens(state) : this.tokens.slice())
    );
  }

  displayWith(value) {
    if (value) {
      return this.tokens?.find(token => token.address === value.address).symbol;
    }
    return '';
  }

  private filterTokens(value: string): Token[] {
    if (typeof value === 'string') {
      const filterValue = value.toLowerCase();
      return this.tokens.filter(state => state.symbol.toLowerCase().indexOf(filterValue) === 0);
    }
  }
}
