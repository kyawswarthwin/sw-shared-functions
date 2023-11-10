export interface Message {
  type: string;
  payload?: any;
  port?: MessagePort;
}

export function sendMessage(
  source: Client | ServiceWorker | MessagePort,
  type: string,
  payload?: any,
  transfer: Transferable[] = [],
  timeout?: number
): Promise<Message> {
  if (source instanceof MessagePort) {
    return new Promise<Message>((resolve, reject) => {
      source.onmessage = ({ data }) => {
        resolve({ ...data });
      };

      source.onmessageerror = reject;

      source.postMessage({ type, payload }, [...transfer]);

      if (timeout) {
        setTimeout(() => {
          source.close();

          reject(new Error('Timeout'));
        }, timeout);
      }
    });
  }

  const { port1, port2 } = new MessageChannel();

  const doSend = () => {
    try {
      return new Promise<Message>((resolve, reject) => {
        port1.onmessage = ({ data }) => {
          resolve({ ...data, port: port1 });
        };

        port1.onmessageerror = reject;

        source.postMessage({ type, payload }, [port2, ...transfer]);

        if (timeout) {
          setTimeout(() => {
            port1.close();

            reject(new Error('Timeout'));
          }, timeout);
        }
      });
    } finally {
      port2.close();
    }
  };

  return doSend();
}
