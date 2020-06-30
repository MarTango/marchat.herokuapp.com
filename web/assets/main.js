import { IncomingCall, OutgoingCall } from "./src/call.js";
// import Room from "room.js";

/** @type {[string: RTCPeerConnection]} */
const OUTGOING_CALLS = {};
const INCOMING_CALLS = {};
const PENDING_OUTGOING_CALLS = {};

const messages = document.querySelector("ul#messages");
const message = document.querySelector("#m");

function addMessage(message) {
  const elt = document.createElement("li");
  elt.innerText = message;
  messages.appendChild(elt);
}

window.addEventListener("load", async () => {
  let socket = io();
  registerSocketBaseHandlers(socket);

  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
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
    const elt = document.querySelector(`audio#x${sid}`);
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

    await socket.emit("answer", JSON.stringify(await receiver.accept(offer)));
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
});

function registerSocketBaseHandlers(socket) {
  socket.on("chatmsg", addMessage);

  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    socket.send(message.value);
    message.value = "";
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
