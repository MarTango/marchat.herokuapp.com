import { IncomingCall, OutgoingCall } from "./call.js";
// import Room from "room.js";

/** @type {[string: RTCPeerConnection]} */
const OUTGOING_CALLS = {};
const INCOMING_CALLS = {};
const PENDING_OUTGOING_CALLS = {};
/** @type {HTMLUListElement} */
const MESSAGES = document.querySelector("ul#messages");
/** @type {HTMLInputElement} */
const MESSAGE = document.querySelector("input#m");

function addMessage(message) {
  const elt = document.createElement("li");
  elt.innerText = message;
  MESSAGES.appendChild(elt);
}

const peerConnectionConfig = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
};
const ROOM = "bravo";

window.onload = async () => {
  /** @type {SocketIO.Socket} */
  const sock = io();
  const emit = (msg) => sock.emit(ROOM, msg);
  sock.on("chatmsg", addMessage);
  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    sock.send(MESSAGE.value);
    MESSAGE.value = "";
  });

  const localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: {
      noiseSuppression: true,
      echoCancellation: true,
    },
  });

  document.querySelector("input#muted").addEventListener("change", function () {
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = !this.checked;
    });
  });

  sock.on("connect", async (sid) => {
    addMessage("A user connected");
    if (!sid) {
      return;
    }
    const outgoingCall = new OutgoingCall(emit, sock.id, sid, localStream);
    PENDING_OUTGOING_CALLS[sid] = outgoingCall;
  });

  sock.on("disconnect", async (sid) => {
    addMessage("A user disconnected");
    for (const coll of [OUTGOING_CALLS, INCOMING_CALLS]) {
      if (coll[sid]) {
        console.log(coll[sid]);
        coll[sid].close();
        delete coll[sid];
      }
    }
    const elt = document.querySelector(`video#x${sid}`);
    if (elt) {
      elt.remove();
    }
  });

  sock.on(ROOM, async ({ to, from, candidate, offer, answer }) => {
    if (to != sock.id) {
      return;
    }
    if (candidate) {
      for (const coll of [OUTGOING_CALLS, INCOMING_CALLS]) {
        if (coll[from]) {
          console.log(`${to} adding candidate from ${from}`);
          await coll[from].conn.addIceCandidate(candidate);
        }
      }
    } else if (offer) {
      const receiver = new IncomingCall(emit, sock.id, from, localStream);
      INCOMING_CALLS[from] = receiver;
      await receiver.accept(offer);
    } else if (answer) {
      const call = PENDING_OUTGOING_CALLS[from];
      if (!call) {
        return;
      }
      await call.accept(answer);
      OUTGOING_CALLS[from] = call;
      delete PENDING_OUTGOING_CALLS[from];
    }
  });

  // Check PENDING_OUTGOING_CALLS for anything we need to resend.
  setInterval(() => {
    Object.keys(PENDING_OUTGOING_CALLS).forEach(async (sid) => {
      const call = PENDING_OUTGOING_CALLS[sid];
      await call.offer();
    });
  }, 1000);
};
