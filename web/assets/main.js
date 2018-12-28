import { IncomingCall, OutgoingCall } from "./call.js";
// import Room from "room.js";

/** @type {[string: RTCPeerConnection]} */
const OUTGOING_CALLS = {};
const INCOMING_CALLS = {};

// Hopefully a unique identifier
/** @type {string} My socket's Session ID */
let ME; // entertain you

const messages = document.querySelector("ul#messages");
const message = document.querySelector("#m");

window.onload = async function () {
  let socket = io();
  registerSocketBaseHandlers(socket);

  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });

  document.querySelector("input#muted").addEventListener("change", (e) => {
    localStream.getAudioTracks().forEach(t => t.enabled = !this.checked);
  });

  socket.on("icecandidate", async (e) => {
    const d = JSON.parse(e);
    if (d.to != ME) {
      return;
    }

    if (OUTGOING_CALLS[d.from]) {
      console.log("Out candidate");
      await OUTGOING_CALLS[d.from].conn.addIceCandidate(d.candidate);
    }
    if (INCOMING_CALLS[d.from]) {
      console.log("In candidate");
      await INCOMING_CALLS[d.from].conn.addIceCandidate(d.candidate);
    }

  });

  socket.on("connect", async (sid) => {
    // If someone connects, lets send them a call.
    console.log(`${sid} connected. Let's call them!`);

    // Hopefully the recipient has loaded after 100ms
    await sleep(100);

    const outgoingCall = new OutgoingCall(socket, ME, sid);
    outgoingCall.addStream(localStream);
    OUTGOING_CALLS[sid] = outgoingCall;
    socket.emit("offer", JSON.stringify(await outgoingCall.offer()));
  });

  socket.on("offer", async e => {
    const offer = JSON.parse(e);
    console.log(`${offer.from} is sending out an offer to ${offer.to}`);

    if (offer.to != ME) {
      return;
    }

    const receiver = new IncomingCall(socket, ME, offer.from);
    receiver.addStream(localStream);
    INCOMING_CALLS[offer.from] = receiver;

    await socket.emit("answer", JSON.stringify(
      await receiver.accept(offer)
    ));
  });

  socket.on("answer", async e => {
    console.log("They answered my call");
    const ans = JSON.parse(e);
    // If the answer is to me, register it
    if (ans.to == ME && OUTGOING_CALLS[ans.from]) {
      await OUTGOING_CALLS[ans.from].accept(ans);
    }
  });

};

function registerSocketBaseHandlers(socket) {
  socket.on("connect", () => {
    ME = socket.id;
  });

  socket.on("chatmsg", msg => {
    let elt = document.createElement("li");
    elt.appendChild(document.createTextNode(msg));
    messages.appendChild(elt);
  });

  document.querySelector("form").addEventListener('submit', (e) => {
    e.preventDefault();
    socket.send(message.value);
    message.value = "";
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
