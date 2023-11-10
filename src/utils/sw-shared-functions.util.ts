import { expose, Remote, transferHandlers, wrap } from 'comlink';
import { asyncGeneratorTransferHandler } from 'comlink-async-generator';

import { sendMessage } from './message.util';

declare var self: ServiceWorkerGlobalScope;

transferHandlers.set('asyncGenerator', asyncGeneratorTransferHandler);

export function share(obj: any): void {
  if ('serviceWorker' in navigator) {
    // @ts-ignore
    navigator.serviceWorker.addEventListener(
      'message',
      // @ts-ignore
      ({ data: { type }, ports: [port] }) => {
        if (type === 'PING') {
          sendMessage(port, 'PONG');
        } else if (type === 'COMLINK_INIT') {
          expose(obj, port);
          sendMessage(port, 'COMLINK_READY');
        }
      }
    );
  } else {
    self.addEventListener('message', ({ data: { type }, ports: [port] }) => {
      if (type === 'COMLINK_INIT') {
        expose(obj, port);
        sendMessage(port!, 'COMLINK_READY');
      }
    });
  }
}

export function load<T>(): Promise<Remote<T>> {
  return new Promise(async (resolve, reject) => {
    try {
      if ('serviceWorker' in navigator) {
        const { type, port } = await sendMessage(
          // @ts-ignore
          navigator.serviceWorker.controller!,
          'COMLINK_INIT'
        );
        if (type === 'COMLINK_READY') {
          resolve(wrap<T>(port!));
        }
      } else {
        const client = await getClient();
        const { type, port } = await sendMessage(client, 'COMLINK_INIT');
        if (type === 'COMLINK_READY') {
          resolve(wrap<T>(port!));
        }
      }
    } catch (error) {
      reject(error);
    }
  });
}

function getClient(): Promise<WindowClient> {
  return new Promise(async (resolve, reject) => {
    try {
      const clients = await self.clients.matchAll({
        type: 'window',
      });
      const client = await Promise.race([
        ...clients.map((client) => ping(client)),
      ]);
      resolve(client);
    } catch (error) {
      reject(error);
    }
  });
}

function ping(client: WindowClient): Promise<WindowClient> {
  return new Promise(async (resolve, reject) => {
    try {
      const { type } = await sendMessage(client, 'PING', null, [], 5);
      if (type === 'PONG') {
        resolve(client);
      }
    } catch (error) {
      reject(error);
    }
  });
}
