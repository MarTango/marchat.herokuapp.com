import { IncomingCall, OutgoingCall } from "./call.js";

/** @type {[string: RTCPeerConnection]} */
const RECEIVERS = [];

// Hopefully a unique identifier
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

  // Send an offer out
  let outgoingCall = new OutgoingCall(socket, ME);
  outgoingCall.addStream(localStream);
  await socket.emit("offer", JSON.stringify(await outgoingCall.offer()));

  // TODO: 
  socket.on("icecandidate", async (e) => {
    const data = JSON.parse(e);
    if (data.id !== ME) {
      await outgoingCall.conn.addIceCandidate(data.candidate);
    }
    for (const receiver of RECEIVERS) {
      await receiver.conn.addIceCandidate(data.candidate);
    }
  });

  socket.on("offer", async e => {
    const offer = JSON.parse(e);
    if (offer.from == ME) {
      return;
    }
    const receiver = new IncomingCall(socket, ME);
    const answer = await receiver.accept(offer);

    const answerId = RECEIVERS.push(receiver) - 1;
    answer.id = answerId;

    await socket.emit("answer", JSON.stringify(answer));
  });

  socket.on("answer", async e => {
    const answer = JSON.parse(e);
    // If the answer is to me, register it
    if (answer.to == outgoingCall.owner) {
      await outgoingCall.accept(answer);
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

  // Make the form send the message over the socket, and then empty
  // its value.
  document.querySelector("form").addEventListener('submit', (e) => {
    e.preventDefault();
    socket.send(message.value);
    message.value = "";
  });
}
