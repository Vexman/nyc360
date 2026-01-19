import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
    selector: 'img[appImagePlaceholder]',
    standalone: true
})
export class ImagePlaceholderDirective {
    @Input() placeholderType: 'avatar' | 'post' | 'rss' | 'community' | 'default' = 'default';

    constructor(private el: ElementRef) { }

    @HostListener('error')
    onError() {
        const img = this.el.nativeElement as HTMLImageElement;

        // Create placeholder based on type
        const placeholders: { [key: string]: string } = {
            avatar: this.generateAvatarPlaceholder(),
            post: this.generatePostPlaceholder(),
            rss: this.generateRSSPlaceholder(),
            community: this.generateCommunityPlaceholder(),
            default: this.generateDefaultPlaceholder()
        };

        img.src = placeholders[this.placeholderType] || placeholders['default'];
        img.style.objectFit = 'cover';
    }

    private generateAvatarPlaceholder(): string {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23e2e8f0' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='40' fill='%2394a3b8'%3E?%3C/text%3E%3C/svg%3E`;
    }

    private generatePostPlaceholder(): string {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250'%3E%3Crect fill='%23f1f5f9' width='400' height='250'/%3E%3Cg transform='translate(200 125)'%3E%3Ccircle r='30' fill='%23cbd5e1'/%3E%3Cpath d='M-15,-5 L15,-5 L15,5 L-15,5 Z M-10,-15 L-10,15 M0,-15 L0,15 M10,-15 L10,15' stroke='%23fff' stroke-width='3' fill='none'/%3E%3C/g%3E%3C/svg%3E`;
    }

    private generateRSSPlaceholder(): string {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23fee2e2' width='100' height='100'/%3E%3Cg transform='translate(50 50)'%3E%3Ccircle r='25' fill='%23fca5a5'/%3E%3Ctext x='0' y='8' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='30' font-weight='bold' fill='%23fff'%3ERSS%3C/text%3E%3C/g%3E%3C/svg%3E`;
    }

    private generateCommunityPlaceholder(): string {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23dbeafe' width='100' height='100'/%3E%3Cg transform='translate(50 50)'%3E%3Ccircle cx='-10' cy='-5' r='8' fill='%2393c5fd'/%3E%3Ccircle cx='10' cy='-5' r='8' fill='%2393c5fd'/%3E%3Ccircle cx='0' cy='5' r='10' fill='%2360a5fa'/%3E%3C/g%3E%3C/svg%3E`;
    }

    private generateDefaultPlaceholder(): string {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f8fafc' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%23cbd5e1'%3ENo Image%3C/text%3E%3C/svg%3E`;
    }
}
