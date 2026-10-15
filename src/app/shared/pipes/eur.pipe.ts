import { Pipe, PipeTransform } from '@angular/core';

const FORMAT = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

// Un solo formato de precio en toda la web: "15,00 €"
@Pipe({ name: 'eur', standalone: true })
export class EurPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return value == null ? '' : FORMAT.format(value);
  }
}
