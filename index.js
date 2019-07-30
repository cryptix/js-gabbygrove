const { BinaryRef } = require('./binaryref')

var cbor = require('cbor')

// ssb-keys only exports signObj and verifyObj so we use sodium directly
var sodium = require('sodium-native')

/* verify transfer checks the content was signed by the author of the event
*/
exports.verifyTransfer = (trBuf, cb) => {
    // decode Buffer to cbor object

    if (!Buffer.isBuffer(trBuf)) return cb(new Error('expected buffer as first argument'))

    var dec = this.newDecoder()

    dec.on('data', (transferArr) => {
        // verify structure (enum values etc)
        if (!Array.isArray(transferArr)) return cb(new Array('expected trasnfer to be encoded as an array'))
        if (transferArr.length !== 3) return cb(new Array('expected 3 elements in transfer array'))

        var evtBytes = transferArr[0]
        var signature = transferArr[1]
        var content = transferArr[2]

        // compare content hash
        var computedHash = binrefContentHash(content).data

        // decode event from transfer (for content hash and author)
        decodeEvent(evtBytes, (err, evtFromTr) => {
            if (err) return cb(err)
            
            // TODO: check content.hash[0] is right RefType enum value
            var sentHash = evtFromTr.content.hash.data
            
            if (!computedHash.equals(sentHash)) return cb(new Error('gabbygrove: content hash comprassion failed'))
            
            // TODO: check author[0] is right RefType enum value
            var authorPubKey = evtFromTr.author.data
            
            if (signature.length !== 64) return cb(new Error('gabbygrove: expected 64 bytes signature'))
            
            var verified = sodium.crypto_sign_verify_detached(signature, evtBytes, authorPubKey)
            if (!verified) return cb(new Error('gabbygrove: signature verification failed'))
            
            // might want to return the deocdec transfer to store it, just a demo
            
            cb(null, {
                key: binrefMessageHash(Buffer.concat([
                    evtBytes,
                    signature,
                ])),
                evt: evtFromTr,
                content: JSON.parse(content)
            })
        })
    })
    bufferToStream(trBuf).pipe(dec)
}

// very bad chain maker
function makeEvent(keyPair, sequence, prev, content) {

    let jsonBufContent = Buffer.from(JSON.stringify(content), 'utf8')

    // fill event fields
    var previous = null
    if (sequence > 1 && prev === null) throw new Error('seq > 1! must have previous')
    if (sequence > 1) {
        previous = prev
    }
    
    let event = [
        previous,
        new BinaryRef(1, Buffer.from(keyPair.public.replace(/\.ed25519$/, ''), 'base64')),
        sequence,
        Date.now(),
        [
            1, // JSON enum value
            jsonBufContent.length,
            binrefContentHash(jsonBufContent),
        ],
    ]
    
    // encode event to buffer
    let evtBuf = cbor.encode(event)

    // sign evtBuf with passed keypair
    let signature = Buffer.alloc(sodium.crypto_sign_BYTES)
    let secret = Buffer.from(keyPair.private.replace(/\.ed25519$/, ''), 'base64')
    sodium.crypto_sign_detached(signature, evtBuf, secret)

    // compute hash of the signed event
    let key = binrefMessageHash(Buffer.concat([
        evtBuf,
        signature,
    ]))

    // fill transfer fields
    let transfer = [
        evtBuf,
        signature,
        jsonBufContent,
    ]

    let trBytes = cbor.encode(transfer)

    return {
        key: key,
        event: event,
        transfer: transfer,
        trBytes: trBytes,
    }
}
exports.makeEventSync = makeEvent
exports.makeEvent = ({ keyPair, sequence, prev, content }, cb) => {
    try {
        let newMsg = makeEvent(keyPair, sequence, prev, content)
        cb(null, newMsg)
    } catch (error) {
        cb(error)
    }
}

const { Readable } = require('stream')
/**
 * @param binary Buffer
 * returns readableInstanceStream Readable
 */
function bufferToStream(binary) {
    const readableInstanceStream = new Readable({
        read() {
            this.push(binary);
            this.push(null);
        }
    });

    return readableInstanceStream;
}


function newDecoder() {
    return new cbor.Decoder({
        tags: {
            1050: (val) => {
                // check val to make sure it's an Array as expected, etc.
                
                if (val.length !== 33) throw new Error("invalid cipherlink length:" + val.length)
                // console.warn("got:",val.toString('hex'))
                
                // todo: improve error checks
                const br = new BinaryRef(val[0], val.slice(1))
                return br
            }
        }
    })
}
exports.newDecoder = newDecoder

function decodeEvent(evtBuf, cb) {
    var dec = newDecoder()
    dec.on('data', (evtArr) => {
        if (!Array.isArray(evtArr)) return cb(new Array('expected event to be encoded as an array'))
        if (evtArr.length !== 5) return cb(new Array('expected 5 elements in the array'))

        var evt = {
            previous: evtArr[0],
            author: evtArr[1],
            sequence: evtArr[2],
            timestamp: evtArr[3],
            content: {
                encoding: evtArr[4][0],
                size: evtArr[4][1],
                hash: evtArr[4][2],
            }
        }
        cb(null, evt)
    })
    bufferToStream(evtBuf).pipe(dec)
}
exports.decodeEvent = decodeEvent



function binrefMessageHash(content) {
    let buf = Buffer.alloc(32)
    sodium.crypto_hash_sha256(buf, content)
    return new BinaryRef(2, buf)
}

function binrefContentHash(content) {
    let buf = Buffer.alloc(32)
    sodium.crypto_hash_sha256(buf, content)
    return new BinaryRef(3, buf)
}
