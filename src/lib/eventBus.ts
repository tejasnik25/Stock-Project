type Subscriber = (event: any) => void;

class EventBus {
  private subscribers: Map<string, Set<Subscriber>> = new Map();

  subscribe(channel: string, cb: Subscriber) {
    const subs = this.subscribers.get(channel) || new Set();
    subs.add(cb);
    this.subscribers.set(channel, subs);
    return () => this.unsubscribe(channel, cb);
  }

  unsubscribe(channel: string, cb: Subscriber) {
    const subs = this.subscribers.get(channel);
    if (!subs) return;
    subs.delete(cb);
    if (subs.size === 0) this.subscribers.delete(channel);
  }

  publish(channel: string, event: any) {
    const subs = this.subscribers.get(channel);
    if (!subs) return;
    for (const cb of subs) {
      try {
        cb(event);
      } catch (e) { /* ignore subscriber errors */ }
    }
  }
}

const globalBus = new EventBus();

export default globalBus;
