export class FlowControlQueueInfo {
  maxRequests = 4;

  occupiedSlots = 0;

  counter = 0;

  constructor(maxRequests?: number) {
    if (maxRequests) {
      this.maxRequests = maxRequests;
    }
  }
}
