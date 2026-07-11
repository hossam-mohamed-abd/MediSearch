import {
    Component,
    inject,
    signal,
  } from '@angular/core';
  
  import { CommonModule } from '@angular/common';
  
  import { PharmacyAuthService } from '../../../../core/services/pharmacy-auth.service';
  
  @Component({
    selector: 'app-upload-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './upload-card.component.html',
    styleUrl: './upload-card.component.css',
  })
  export class UploadCardComponent {
  
    private service =
      inject(PharmacyAuthService);
  
    selectedFile =
      signal<File | null>(null);
  
    uploading =
      signal(false);
  
    successMessage =
      signal('');
  
    errorMessage =
      signal('');
  
    onFileSelected(
      event: Event,
    ) {
  
      const input =
        event.target as HTMLInputElement;
  
      if (!input.files?.length) {
        return;
      }
  
      this.selectedFile.set(
        input.files[0],
      );
  
    }
  
    upload() {
  
      if (!this.selectedFile()) {
        return;
      }
  
      this.uploading.set(true);
  
      this.successMessage.set('');
  
      this.errorMessage.set('');
  
      this.service
        .uploadInventory(
          this.selectedFile()!,
        )
        .subscribe({
  
          next: (res: any) => {
  
            this.successMessage.set(
              res.message,
            );
  
            this.uploading.set(false);
  
            this.selectedFile.set(null);
  
          },
  
          error: (err) => {
  
            this.errorMessage.set(
              err.error?.message ??
              'Upload failed',
            );
  
            this.uploading.set(false);
  
          },
  
        });
  
    }
  
  }