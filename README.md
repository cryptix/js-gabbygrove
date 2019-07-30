# Gabby Grove

this is an experimental, CBOR based feed format for secure-scuttlebutt.

It spec draft will be published to the [ssb-spec-drafts](https://github.com/ssbc/ssb-spec-drafts). The current working copy can be found on the [core-gabbygrove-00 branch](https://github.com/ssbc/ssb-spec-drafts/tree/core-gabbygrove-00).

# Structures

See the working copy for an detailed description of the fields in the `Event` and `Transfer` strucutre.

<!--
## Event

An array of length five with various data...



## Transfer

An array of length three, each being a bytes array

1. `eventBytes`
2. `signature`
3. `content` (optional) -->

# API

## verifyTransfer

`verifyTransfer(Buffer, cb)` expects a `Buffer` as it's first argument, it will be decoded as a `Transfer` message (three cbor arrays). Then, the first element of `Transfer` will be decoded as an `Event`. The author inside the event will be used to verify the `Signature` (field number to of `Transfer`). If present, the `content` will be hashed and compared against the `content.hash` inside the `Event`, as well.

If anything fails, the callback will be called with an error as it's first argument.
If successfull, the first argument will be null and the seconed one will get this decoded data:

```js
{
    key: BinaryRef(), // of the received event
    evt: decodedEvent,
    content: jsonObject, // JSON.parse of content (if that's the `content.encoding`)
}
```

# makeEvent

`makeEvent(keyPair, sequence, prev, content)` creates a new `Transfer` object with a signed event inside. It's a **low level** function and should be wrapped apropriatly to create the right sequence numbers and use the correct `previous` hashes.

It throws in case of mis-use.

It returns this object:

```js
{
    key: BinaryRef(),  // of the new event
    event: []...,      // array of fields of event
    trBytes: Buffer(), // complete encoded Transfer object
}
`