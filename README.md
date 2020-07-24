# ChairDB

A toy database:

* Immutable events & event sourcing
* Offline & syncing
* Projections & read models

Mayhaps:

* First-class encryption & rekeying support for crypto trashing
* Authentication & authorization like Firestore
* Syncing using CouchDB replication protocol or syncing with EventStore

## Concepts

* Messages
    * Commands (not really part of the event store)
    * Events
* Projections
* Aggregates
    * Aggregate versioning
