# 🚩 EventProxy

Used to route events coming from the State Sender system.
An event has a “type” and the contract can determine where it needs to be forwarded/copied for processing.

## Main Action 🔧

> function **setSenderRegistration**()
Toggles a senders ability to send an event through the contract.
Contracts should call as themselves, and so it will be the contract addresses registered here

```js
    /**
     * @param sender Address of sender
     * @param allowed Allowed to send event
     */
    function setSenderRegistration(
        address sender, 
        bool allowed
    )
```

> function **registerDestinations**()
For a sender/eventType, register destination contracts that should receive events.
This COMPLETELY REPLACES all destinations for the sender/eventType.

```js
    /**
     * @param destinationsBySenderAndEventType Destinations specifies all the destinations for a given sender/eventType combination
     */
    function registerDestinations(
        DestinationsBySenderAndEventType[] memory destinationsBySenderAndEventType
    ) external;
```

> function **getRegisteredDestinations**()
Retrieves all the registered destinations for a sender/eventType key.

```js
    function getRegisteredDestinations(address sender, bytes32 eventType)
        external
        view
        returns (address[] memory);
```

> fucntion **unregisterDestination**()
For a sender, unregister destination contracts on Polygon.

```js
    /**
     * @param sender Address of sender
     */
    function unregisterDestination(
        address sender,
        address l2Endpoint,
        bytes32 eventType
    ) external;
```