// Type definitions for Panolens.js
declare module 'panolens' {
  import { Object3D, Vector3 } from 'three';

  export namespace PANOLENS {
    export enum MODES {
      UNKNOWN = 0,
      NORMAL = 1,
      CARDBOARD = 2,
      STEREO = 3,
      VR = 4
    }

    export interface DataImage {
      Arrow: string;
      Info: string;
    }

    export class Viewer {
      constructor(options?: {
        container?: HTMLElement;
        controlBar?: boolean;
        controlButtons?: string[];
        autoHideInfospot?: boolean;
        autoHideControlBar?: boolean;
        autoRotate?: boolean;
        autoRotateSpeed?: number;
        cameraFov?: number;
        reverseDragging?: boolean;
        enableReticle?: boolean;
        dwellTime?: number;
        autoReticleSelect?: boolean;
        passiveRendering?: boolean;
      });

      add(panorama: Panorama): void;
      remove(panorama: Panorama): void;
      setPanorama(panorama: Panorama): void;
      enableEffect(mode: MODES): void;
      disableEffect(): void;
      dispose(): void;
      panoramas: Panorama[];
    }

    export class Panorama extends Object3D {
      add(object: Object3D): void;
      remove(object: Object3D): void;
      addEventListener(type: string, listener: (event?: any) => void): void;
      removeEventListener(type: string, listener: (event?: any) => void): void;
    }

    export class ImagePanorama extends Panorama {
      constructor(image: string | HTMLImageElement);
    }

    export class VideoPanorama extends Panorama {
      constructor(video: string | HTMLVideoElement);
    }

    export class CubePanorama extends Panorama {
      constructor(images: string[]);
    }

    export class Infospot extends Object3D {
      constructor(scale?: number, imageSrc?: string, animated?: boolean);

      position: Vector3;
      scale: Vector3;
      userData: any;

      addHoverText(text: string, delta?: number): void;
      addHoverElement(element: HTMLElement, delta?: number): void;
      removeHoverElement(): void;
      lockHoverElement(): void;
      unlockHoverElement(): void;
      show(duration?: number): void;
      hide(duration?: number): void;
      setOpacity(opacity: number): void;
      addEventListener(type: string, listener: (event?: any) => void): void;
      removeEventListener(type: string, listener: (event?: any) => void): void;
    }

    export const DataImage: DataImage;
  }

  export = PANOLENS;
}

// Global type augmentation for window object
declare global {
  interface Window {
    THREE: any;
    PANOLENS: typeof PANOLENS;
  }
}