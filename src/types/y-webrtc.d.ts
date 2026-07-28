declare module 'y-webrtc' {
  import * as Y from 'yjs';
  
  export class WebrtcProvider {
    constructor(
      roomName: string,
      doc: Y.Doc,
      options?: {
        signaling?: string[];
        password?: string;
        awareness?: any;
        maxConns?: number;
        filterBcConns?: boolean;
        peerOpts?: any;
      }
    );
    
    awareness: {
      setLocalStateField(field: string, value: any): void;
      getStates(): Map<number, any>;
      on(event: string, callback: (...args: any[]) => void): void;
      off(event: string, callback: (...args: any[]) => void): void;
    };
    
    connect(): void;
    disconnect(): void;
    destroy(): void;
  }
}
