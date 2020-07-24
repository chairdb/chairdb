import { InMemoryLog } from "./in-memory-log"

const event1 = {
    aggregateId: 'id-1',
    aggregateVersion: 0,
    eventId: 'event-id-1',
    name: 'SomethingHappened',
    payload: {
        a: 22,
        b: true,
        s: 'string'
    },
    timestamp: 111111111,
}

const event2 = {
    aggregateId: 'id-2',
    aggregateVersion: 0,
    eventId: 'event-id-2',
    name: 'OtherThingHappened',
    payload: null,
    timestamp: 111111112,
}

describe('InMemoryLog#all', () => {
    it('should be empty if no events have been added yet', async () => {
        const log = new InMemoryLog()
        expect(await log.all()).toHaveLength(0)
    })

    it('should list all events', async () => {
        const log = new InMemoryLog()

        log.append(event1)
        log.append(event2)

        expect(await log.all()).toEqual([event1, event2])
    })
})
