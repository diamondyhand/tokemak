# 🚩 OnChainVoteL1


## Main Action 🔧

> function **setDestinations**()
Configure the Polygon state sender root and destination for messages sent.

```js
    /**
     * @param fxStateSender Address of Polygon State Sender Root contract
     * @param destinationOnL2 Destination address of events sent. Should be our Event Proxy
     */
    function setDestinations(
        address fxStateSender, 
        address destinationOnL2
    ) external;
```

> function **setEventSend**()
Enables or disables the sending of events.

```js
    function setEventSend(
        bool eventSendSet
    ) external;    
```