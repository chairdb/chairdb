/**
 * An immutable event with a payload of type T. Note that the payload should be JSON-serializable.
 */
export type Event<T = unknown, N = string> = {
  /**
   * Name of the event, e.g. 'WorkoutStarted', 'TradeExecuted'
   */
  readonly name: N;

  /**
   * The actual event data
   */
  readonly payload: T;

  readonly aggregateId: string;
  readonly aggregateVersion: number;

  /**
   * Id of the event. Used to de-duplicate events.
   */
  readonly eventId: string;

  /**
   * Seconds since the epoch
   */
  readonly timestamp: number;

  readonly correlationId?: string;
  readonly causationId?: string;
};
