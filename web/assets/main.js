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

window.onload = async () => {
  /** @type {SocketIO.Socket} */
  let socket = io();
  socket.on("chatmsg", addMessage);
  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    socket.send(MESSAGE.value);
    MESSAGE.value = "";
  });

  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      noiseSuppression: true,
      echoCancellation: true,
    },
    video: true,
  });

  document.querySelector("input#muted").addEventListener("change", function () {
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = !this.checked;
    });
  });

  socket.on("icecandidate", async (e) => {
    const d = JSON.parse(e);
    if (d.to != socket.id) {
      return;
    }

    for (const coll of [OUTGOING_CALLS, INCOMING_CALLS]) {
      if (coll[d.from]) {
        await coll[d.from].conn.addIceCandidate(d.candidate);
      }
    }
  });

  // Check PENDING_OUTGOING_CALLS for anything we need to resend.
  setInterval(() => {
    Object.keys(PENDING_OUTGOING_CALLS).forEach(async (sid) => {
      const call = PENDING_OUTGOING_CALLS[sid];
      socket.emit("offer", JSON.stringify(await call.offer()));
    });
  }, 1000);

  socket.on("connect", async (sid) => {
    addMessage("A user connected");
    const outgoingCall = new OutgoingCall(socket, socket.id, sid);
    outgoingCall.addStream(localStream);
    PENDING_OUTGOING_CALLS[sid] = outgoingCall;
  });

  socket.on("disconnect", async (sid) => {
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

  socket.on("offer", async (e) => {
    const offer = JSON.parse(e);
    if (offer.to != socket.id) {
      return;
    }

    const receiver = new IncomingCall(socket, socket.id, offer.from);
    receiver.addStream(localStream);
    INCOMING_CALLS[offer.from] = receiver;

    socket.emit("answer", JSON.stringify(await receiver.accept(offer)));
  });

  socket.on("answer", async (e) => {
    console.log("They answered my call");
    const ans = JSON.parse(e);
    // If the answer is to me, register it
    if (ans.to == socket.id && PENDING_OUTGOING_CALLS[ans.from]) {
      await PENDING_OUTGOING_CALLS[ans.from].accept(ans);
      OUTGOING_CALLS[ans.from] = PENDING_OUTGOING_CALLS[ans.from];
      delete PENDING_OUTGOING_CALLS[ans.from];
    }
  });
};
