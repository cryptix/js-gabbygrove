var ssbKeys = require('ssb-keys')
var tape = require('tape')
var gabby = require('..')

tape("make event", (t) => {
    const kp = ssbKeys.generate()

    var c1 = {
        type: 'test',
        i: 0,
    }

    let evt1 = gabby.makeEventSync(kp, 1, null, c1)
    t.notEqual(evt1.key, '', 'has a key')
    t.equal(evt1.transfer[1].length, 64, 'has 64bytes of sig')

    
    gabby.verifyTransfer(evt1.trBytes, (err, tr1) => {
        t.error(err, 'err from verify 1')
        t.ok(tr1, 'verfied 1')
        
        
        // event 2
        var c2 = {
            type: 'test',
            i: 1,
        }
    
        let evt2 = gabby.makeEventSync(kp, 2, evt1.key, c2)
        t.equal(evt2.event[0], evt1.key, 'previous is key of evt1')
    
    
        gabby.verifyTransfer(evt2.trBytes, (err, tr2) => {
            t.error(err, 'err from verify2')
            t.ok(tr2, 'verified 2')
            t.end()
        })
    })
})