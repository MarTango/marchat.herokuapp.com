const _peerConnectionConfig = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
};

const STREAMS = [];

/**
 * Return a function that does:
 *
 * Create an <audio> element, set its srcObject as the stream attached
 * to e, then append the element to the document's body.
 *
 * @param {RTCTrackEvent} e
 */
function getTrackHandler(id) {
  return function (e) {
    console.log("Got track!");
    const stream = e.streams[0];

    if (STREAMS.indexOf(stream) !== -1) {
      return;
    }
    STREAMS.push(stream);

    const elt = document.createElement("audio");
    elt.id = `x${id}`;
    elt.autoplay = true;
    elt.controls = true;
    elt.srcObject = stream;
    document.body.appendChild(elt);
  };
}

class Call {
  /**
   * @param {(msg: any) => Promise<void>} emit
   * @param {string} myId
   * @param {string} theirId
   */
  constructor(emit, myId, theirId) {
    console.log(`${myId} Creating connection for ${theirId}`);
    const conn = new RTCPeerConnection(_peerConnectionConfig);

    conn.ontrack = getTrackHandler(theirId);

    conn.addEventListener("icecandidate", async (e) => {
      console.log(`${myId}: Emitting ice candidate for ${theirId}`);
      await emit({
        from: myId,
        to: theirId,
        candidate: e.candidate,
      });
    });

    this.conn = conn;
    this.from = myId;
    this.to = theirId;
  }

  addStream(stream) {
    console.log(`${this.from} adding track for ${this.to}`);
    stream.getTracks().forEach((t) => this.conn.addTrack(t, stream));
  }

  close() {
    return this.conn.close();
  }
}

export class IncomingCall extends Call {
  /**
   * @param {RTCSessionDescriptionInit} offer
   */
  async accept(offer) {
    let c = this.conn;
    console.log(`${this.from} accepting offer from ${this.to}`);
    await c.setRemoteDescription(offer);
    const desc = await c.createAnswer();
    await c.setLocalDescription(desc);

    return {
      to: this.to, // should == this.to
      from: this.from,
      answer: desc,
    };
  }
}

export class OutgoingCall extends Call {
  async accept(answer) {
    console.log(`${this.from} accepting answer from ${this.to}`);
    await this.conn.setRemoteDescription(answer);
  }

  async offer() {
    const c = this.conn;
    console.log(`${this.from} creating offer for ${this.to}`);
    const desc = await c.createOffer();

    await c.setLocalDescription(desc);
    return {
      to: this.to,
      from: this.from,
      offer: desc,
    };
  }
}
