import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Injectable({
  providedIn: 'root'
})
/**
 * Saves and provides svg images from firebase storage.
 */
export class ImageService {

  constructor(private fireStorage: AngularFireStorage) { }

  /**
   * Uploads the image (an svg) to firebase storage.
   * Resolves with the filename once the image is uploaded.
   */
  public uploadImage(image: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const filename = new Date().getTime() + ".svg";
      this.fireStorage.ref(filename).put(image).then(() => resolve(filename));
    })
  }

  /**
   * Retrieves an image from firebase storage.
   * Resolves with the image as a "url" that can be used as the source of an img element.
  */
  public getImage(filename: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.fireStorage.ref(filename).getDownloadURL().subscribe(url => resolve(url));
    })
  }
}
