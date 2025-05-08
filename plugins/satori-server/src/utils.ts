export interface Message {
  uid: string
  /**
   * Identify message order.
   * 
   * 1. 10 digits fixed in 0
   * 2. 42 digits Unix Epoch timestamp (milliseconds) of 1970.1.1 to 2109.1.1
   * 3. 12 digits serial number
   */
  seq: `0000000000${number}`
  syncFlag: MessageSyncFlag
  dead: boolean
  isEvent: boolean
  eventType: string
  eventId: string
}

export enum MessageSyncFlag {
  SPAN = 0,
  OLD = 1,
  NEW = 2,
  POINT = 3,
}

export {}
