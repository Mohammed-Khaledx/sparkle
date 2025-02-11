import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safeUrl',
  standalone: true
})
export class SafeUrlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(url: string | File): SafeUrl {
    if (url instanceof File) {
      return this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(url));
    }
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }
}