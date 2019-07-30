var cbor = require('cbor')

exports.BinaryRef = class BinaryRef {
    constructor(type, buf) {
        if (typeof type === 'undefined' || typeof buf === 'undefined') {
            throw new Error('binref invalid constructor call')
        }
        if (type < 1 || type > 3) {
            throw new Error('invalid binref type:' + type)
        }
        this.type = type
        
        if (!Buffer.isBuffer(buf) || buf.length != 32) {
            throw new Error('invalid buffer len:' + typeof buf)
        }
        this.data = buf
        // return this

        // TODO: support multiple arguments
        // if (!arguments.length) {
        //     throw new Error('invalid constructure signature - call with Buffer(33), (Type, Buffer(32)) or String')
        // }
        // if (arguments.length == 1) {
        //     var buf = arguments[0]
        //     if (Buffer.isBuffer(buf) && buf.length == 33) {
        //         this.type = buf[0]
        //         this.data = buf.slice(1)
        //         return this
        //     } else if (typeof buf === 'string') {
        //         // parse all the others
        //         if (buf.startsWith('@')) buf = buf.slice(1)
        //         var buf = binrefAuthor(buf)
        //         this.type = buf[0]
        //         this.data = buf.slice(1)
        //         return 
        //     }
        // } else if (arguments.length == 2) {
        //     return this
        // }
    }
    encodeCBOR(encoder) {
        let tipe = Buffer.alloc(1)
        tipe.writeInt8(this.type)
        const tagged = new cbor.Tagged(1050, Buffer.concat([tipe, this.data]))
        return encoder.pushAny(tagged)
    }

    ref() {
        var prefix = ';invalid!!!'
        var suffix = ';invalid!!!'
        switch (this.type) {
            case 0:
                throw new Error('unknown tipe')

            case 1: // gg feed ref
                prefix = '@'
                suffix = '.ggfeed-v1'
                break
            case 2: // ggmsg
                prefix = '%'
                suffix = '.ggmsg-v1'
                break

            case 3: // gg content hash
                prefix = '!'
                suffix = '.gabby-v1-content'
                break

            default:
                throw new Error('unknown tipe')
        }


        return [
            prefix,
            this.data.toString('base64'),
            suffix,
        ].join('')
    }
}
