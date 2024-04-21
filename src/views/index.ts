import { ReactNode } from "react";
import { createRoot, Root } from "react-dom/client";


export class ViewApp {
  private rootDom: Root

  constructor(body: HTMLElement) {
    createRoot(body)
  }

  render(node: ReactNode) {
    return this.rootDom.render(node)
  }
}
