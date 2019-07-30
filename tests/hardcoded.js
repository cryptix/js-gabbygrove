var ssbKeys = require('ssb-keys')
var cbor = require('cbor')

var tape = require('tape')

var gabby = require('..')

const { BinaryRef } = require('../binaryref')

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

tape("hardcoded event decode", (t) => {

    // example from encoder go test:
    var input = Buffer.from("85d9041a5821026265656662656566626565666265656662656566626565666265656662656566d9041a582101aed3dab65ce9e0d6c50d46fceffb552296ed21b6e0b537a6a0184575ce8f5cbd031a5d3f888283011869d9041a58210327d0b22f26328f03ffce2a7c66b2ee27e337ca5d28cdc89ead668f1dd7f0218b", "hex")
    
    var dec = gabby.newDecoder()

    dec.on('data', (obj)=> {
        t.equal(typeof obj, 'object', 'object (array actualy...)')
        t.equal(obj.length, 5, 'length')
        
        
        var previous = obj[0]
        var author = obj[1]
        var sequence = obj[2]
        var timestamp = obj[3]
        var content = {
            encoding:obj[4][0],
            size: obj[4][1],
            hash: obj[4][2],
        }
    
        t.equal(previous.ref(), '%YmVlZmJlZWZiZWVmYmVlZmJlZWZiZWVmYmVlZmJlZWY=.ggmsg-v1', "has previous")
        t.equal(sequence, 3, 'sequence')
        t.equal(author.ref(), "@rtPatlzp4NbFDUb87/tVIpbtIbbgtTemoBhFdc6PXL0=.ggfeed-v1", 'author')
        t.equal(timestamp, 1564444802, 'timestamp')

        t.equal(content.hash.ref(), '!J9CyLyYyjwP/zip8ZrLuJ+M3yl0ozcierWaPHdfwIYs=.gabby-v1-content', 'content hash')
        t.equal(content.size, 105, 'size')
        t.equal(content.encoding, 1, 'encoding')
        

        t.equal(author.data.length, 32, 'all the author bytes')
                
        // generate key-pair with same seed
        var seed = Buffer.from("dead".repeat(8))
        var testKp = ssbKeys.generate('ed25519', seed)
        var pubBytes = Buffer.from(testKp.public.replace(/\.ed25519$/, ''), 'base64')

        t.true(author.data.equals(pubBytes), "same test keypair")
        t.end()
    })
    
    bufferToStream(input).pipe(dec)
})

/* test content decode
    // from go test, msg3 (type:contact spectating:true)
    var trBuf = Buffer.from("0a710a2102bb4ba82ee4180789b937080bd995d00966f3a13bf35785c2af51f480fbcb1cdf1221018a35dfa466b23c247f957d71504c01074653df6a6a831108d015ea894b192203180422270801102a1a210388feb52df7ad32786e8c1e527a75b9b2ad71445752a18eb25481dfc98445422f124071e1eed9f315fcb708bd08cdc86a2e5b2324ad6485979ff81e5390358f83a4ff8da3f5d7fa9f0f3174d6a2bbeeac02746e3372a6ec81e80b0a3aca4bf667c90b1a2a7b22736571223a322c2273706563746174696e67223a747275652c2274797065223a2274657374227d0a", 'hex')

    // throws on invalid
    var event
    try {
        event = gabby.verifyTransferSync(trBuf)
    } catch (e) {
        t.error(e)
        t.end()
        return
    }
    // console.dir(event)
    t.equal(event.content.seq, 2)
    t.equal(event.content.type, 'test')
    t.equal(event.content.spectating, true)
    t.end()

*/

/*
tape("new Event", (t) => {
    // Create a new message
    var evt1 = {
        sequence: 42,
        timestamp: 0,
        content: {
            type: 1,
        }
    }
    var pbEvent = event.create(evt1); // or use .fromObject if conversion is necessary

    var buffer = event.encode(pbEvent).finish();
    console.log("evt1:", buffer.toString('base64'))

    // create an event from raw bytes
    var decodedEvt = event.decode(buffer);

    var object = event.toObject(decodedEvt, convertOpts);
    console.log("evt1 to obj:")
    console.log(object)
    
})
*/