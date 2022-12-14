import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
/**
 * The main app component
 */
export class AppComponent implements OnInit {

  ngOnInit(): void {
    /**
     * The whiteboard package I am using automatically downloads the whiteboard as an image whenever I retrieve it.
     * This is a very hacky way to get prevent that. The package downloads the file by clicking on a link it creates outside
     * of the app-root. This prevent any click anywhere but within the app-root.
     * Based on: https://stackoverflow.com/a/19780264
     * Note: I don't believe I can access the document using @ViewChild because the document is not included in this component
     */
    document.documentElement.addEventListener("click", (e: MouseEvent): void => {
      if (!(e.target as Element).closest("app-root")) {
        // element being clicked is not in the app-root
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);
  }
}
