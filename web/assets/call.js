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

    const elt = document.createElement("video");
    elt.id = `x${id}`;
    elt.autoplay = true;
    elt.controls = true;
    elt.srcObject = stream;
    document.body.appendChild(elt);
  };
}

class Call {
  /**
   * @param {RTCPeerConnection} conn
   * @param {string} myId
   * @param {string} theirId
   */
  constructor(sock, myId, theirId) {
    const conn = new RTCPeerConnection(_peerConnectionConfig);

    conn.ontrack = getTrackHandler(theirId);

    conn.addEventListener("icecandidate", async (e) => {
      console.log(`${myId}: Emitting ice candidate for ${theirId}`);
      await sock.emit(
        "icecandidate",
        JSON.stringify({
          from: myId,
          to: theirId,
          candidate: e.candidate,
        })
      );
    });

    this.conn = conn;
    this.from = myId;
    this.to = theirId;
  }

  addStream(stream) {
    stream.getTracks().forEach((t) => this.conn.addTrack(t, stream));
  }

  close() {
    return this.conn.close();
  }
}

export class IncomingCall extends Call {
  /**
   * @param {{from: string, desc: RTCSessionDescriptionInit}} offer
   */
  async accept(offer) {
    let c = this.conn;
    await c.setRemoteDescription(offer.desc);
    const desc = await c.createAnswer();
    await c.setLocalDescription(desc);

    return {
      to: offer.from, // should == this.to
      from: this.from,
      desc,
    };
  }
}

export class OutgoingCall extends Call {
  async accept(answer) {
    let c = this.conn;
    await c.setRemoteDescription(answer.desc);
  }

  async offer() {
    const c = this.conn;
    const desc = await c.createOffer();

    await c.setLocalDescription(desc);
    return {
      to: this.to,
      from: this.from,
      desc,
    };
  }
}
