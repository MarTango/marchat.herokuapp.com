const _peerConnectionConfig = {
  iceServers: [
    {urls:['stun:stun.l.google.com:19302']},
    // {urls:['stun:stun1.l.google.com:19302']},
    // {urls:['stun:stun2.l.google.com:19302']},
    // {urls:['stun:stun3.l.google.com:19302']},
  ],
};

class Call {
  /**
   * @param {RTCPeerConnection} conn
   * @param {string} owner
   */
  constructor(sock, owner) {
    const conn = new RTCPeerConnection(_peerConnectionConfig);
    conn.ontrack = trackHandler;
    conn.addEventListener("icecandidate", async e => {
      await sock.emit("icecandidate", JSON.stringify({
        id: owner,
        candidate: e.candidate,
      }));
    });

    this.conn = conn;
    this.owner = owner;
  }

  addStream(stream) {
    stream.getTracks().forEach((t) => this.conn.addTrack(t, stream));
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
      to: offer.from,
      from: this.owner,
      desc
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
      from: this.owner,
      desc
    };
  }
}

/**
 * Create an <audio> element, set its srcObject as the stream attached
 * to e, then append the element to the document's body.
 *
 * @param {RTCTrackEvent} e
 * @return {void}
 */
function trackHandler(e) {
  const audio = document.createElement("audio");
  audio.setAttribute("autoplay", "");
  audio.setAttribute("controls", "");
  audio.setAttribute("playsinline", "");
  audio.srcObject = e.streams[0];
  document.body.appendChild(audio);
}
