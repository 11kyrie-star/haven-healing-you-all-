// 极简 WebSocket 服务端（RFC 6455 子集），零第三方依赖
// 支持：文本帧收发、客户端掩码、分片重组、ping/pong、close 握手
const crypto = require("crypto")

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
const OPEN = 1
const CLOSED = 3

function createWebSocketServer(server, options, onConnection) {
    const pathname = (options && options.path) || "/ws"
    server.on("upgrade", (req, socket) => {
        if ((req.url || "").split("?")[0] !== pathname) {
            socket.destroy()
            return
        }
        const key = req.headers["sec-websocket-key"]
        if (!key) {
            socket.destroy()
            return
        }
        const accept = crypto.createHash("sha1").update(key + GUID).digest("base64")
        socket.write(
            "HTTP/1.1 101 Switching Protocols\r\n" +
            "Upgrade: websocket\r\n" +
            "Connection: Upgrade\r\n" +
            "Sec-WebSocket-Accept: " + accept + "\r\n\r\n"
        )
        onConnection(new WebSocketConnection(socket), req)
    })
}

class WebSocketConnection {
    constructor(socket) {
        this.socket = socket
        this.readyState = OPEN
        this.onMessage = null
        this.onClose = null
        this.onError = null
        this._buffer = Buffer.alloc(0)
        this._fragments = []
        this._closeEmitted = false
        socket.on("data", (chunk) => this._onData(chunk))
        socket.on("close", () => this._emitClose())
        socket.on("error", (err) => {
            if (this.onError) this.onError(err)
        })
    }

    _onData(chunk) {
        this._buffer = Buffer.concat([this._buffer, chunk])
        while (true) {
            const frame = this._parseFrame()
            if (!frame) return
            this._handleFrame(frame)
        }
    }

    _parseFrame() {
        const buf = this._buffer
        if (buf.length < 2) return null
        const fin = (buf[0] & 0x80) !== 0
        const opcode = buf[0] & 0x0f
        const masked = (buf[1] & 0x80) !== 0
        let len = buf[1] & 0x7f
        let offset = 2
        if (len === 126) {
            if (buf.length < 4) return null
            len = buf.readUInt16BE(2)
            offset = 4
        } else if (len === 127) {
            if (buf.length < 10) return null
            const big = buf.readBigUInt64BE(2)
            if (big > BigInt(Number.MAX_SAFE_INTEGER)) { this.close(1009); return null }
            len = Number(big)
            offset = 10
        }
        let maskKey = null
        if (masked) {
            if (buf.length < offset + 4) return null
            maskKey = buf.slice(offset, offset + 4)
            offset += 4
        }
        if (buf.length < offset + len) return null
        let payload = buf.slice(offset, offset + len)
        if (maskKey) {
            payload = Buffer.from(payload)
            for (let i = 0; i < payload.length; i++) payload[i] ^= maskKey[i & 3]
        }
        this._buffer = buf.slice(offset + len)
        return { fin, opcode, payload }
    }

    _handleFrame(frame) {
        if (frame.opcode === 0x8) { this.close(1000); return }
        if (frame.opcode === 0x9) { this.sendRaw(Buffer.concat([Buffer.from([0x8a, frame.payload.length]), frame.payload])); return }
        if (frame.opcode === 0xa) { return }
        if (frame.opcode === 0x0 && this._fragments.length > 0) {
            this._fragments.push(frame.payload)
            if (frame.fin) {
                const full = Buffer.concat(this._fragments)
                this._fragments = []
                if (this.onMessage) this.onMessage(full.toString("utf8"))
            }
            return
        }
        if (frame.opcode === 0x1 || frame.opcode === 0x2) {
            if (!frame.fin) {
                this._fragments = [frame.payload]
                return
            }
            if (this.onMessage) this.onMessage(frame.payload.toString("utf8"))
        }
    }

    send(text) {
        const payload = Buffer.from(String(text), "utf8")
        let header
        const len = payload.length
        if (len < 126) {
            header = Buffer.from([0x81, len])
        } else if (len < 65536) {
            header = Buffer.alloc(4)
            header[0] = 0x81
            header[1] = 126
            header.writeUInt16BE(len, 2)
        } else {
            header = Buffer.alloc(10)
            header[0] = 0x81
            header[1] = 127
            header.writeBigUInt64BE(BigInt(len), 2)
        }
        this.sendRaw(Buffer.concat([header, payload]))
    }

    sendRaw(buf) {
        if (this.readyState !== OPEN) return
        try { this.socket.write(buf) } catch (e) { /* 忽略写失败 */ }
    }

    close(code) {
        if (this.readyState !== OPEN) return
        this.readyState = 2
        try {
            const payload = Buffer.alloc(2)
            payload.writeUInt16BE(code || 1000, 0)
            this.socket.write(Buffer.concat([Buffer.from([0x88, 0x02]), payload]))
        } catch (e) { /* 忽略 */ }
        this.socket.destroy()
        this.readyState = CLOSED
        this._emitClose()
    }

    _emitClose() {
        if (this._closeEmitted) return
        this._closeEmitted = true
        if (this.onClose) this.onClose()
    }
}

module.exports = { createWebSocketServer, WebSocketConnection, OPEN }