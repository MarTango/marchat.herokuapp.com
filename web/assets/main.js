/** @type {[string: RTCPeerConnection]} */
const outgoing = [];
const incoming = [];


// Hopefully unique identifier
let me; // entertain you

const messages = document.querySelector("ul#messages");
const message = document.querySelector("#m");

const peerConnectionConfig = {
  iceServers: [
    {urls:['stun:stun.l.google.com:19302']},
    // {urls:['stun:stun1.l.google.com:19302']},
    // {urls:['stun:stun2.l.google.com:19302']},
    // {urls:['stun:stun3.l.google.com:19302']},
  ],
};

function registerSocketBaseHandlers(socket) {
  socket.on("connect", () => {
    me = socket.id;
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

window.onload = async function () {
  let socket= io();
  registerSocketBaseHandlers(socket);

  // Send an offer out
  let conn = new RTCPeerConnection(peerConnectionConfig);
  var connOutId = outgoing.push(conn) - 1;

  conn.ontrack = () => {
    console.log("track added");
  };

  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });
  localStream.getTracks().forEach(track => conn.addTrack(track, localStream));

  // Create the offer description
  let offer = await conn.createOffer({
    offerToReceiveAudio: true,
    voiceActivityDetection: true,
    offerToReceiveVideo: false,
  });

  console.log("A: Sending out an offer");
  await conn.setLocalDescription(offer);
  await socket.emit("offer", JSON.stringify({from: me, offer, id: connOutId}));

  conn.addEventListener("icecandidate", async e => {
    console.log("A: Emitting ice candidate");
    await socket.emit("icecandidate", JSON.stringify({
      id: me,
      candidate: e.candidate,
    }));
  });

  socket.on("icecandidate", async (e) => {
    const data = JSON.parse(e);
    if (data.id !== me) {
      conn.addIceCandidate(data.candidate);
    }
    // for (const connection of Object.values(incoming)) {
    //   console.log("Adding ice candidate", connection);
    //   await connection.addIceCandidate(data.candidate);
    // }
  });

  socket.on("offer", async e => {
    const {offer, from, id} = JSON.parse(e);

    if (from == me) {
      return;
    }

    console.log("B: Received an offer");

    const peerConn = new RTCPeerConnection(peerConnectionConfig);

    peerConn.addEventListener("track", e => {
      console.log("B: got track");
      const audio = document.createElement("audio");
      audio.setAttribute("autoplay", "");
      audio.setAttribute("controls", "");
      audio.setAttribute("playsinline", "");
      console.log(e);
      audio.srcObject = e.streams[0];

      document.body.appendChild(audio);
    });

    peerConn.addEventListener("icecandidate", async e => {
      socket.emit("icecandidate", JSON.stringify({
        candidate: e.candidate
      }));
    });

    console.log("B: setRemoteDescription on A's description");
    await peerConn.setRemoteDescription(offer);

    console.log("B: createAnswer for A");
    const answer = await peerConn.createAnswer();

    console.log("B: setLocalDescription on my results of createAnswer()");
    peerConn.setLocalDescription(answer);

    incoming[offer.sdp] = peerConn;

    await socket.emit("answer", JSON.stringify({answer, to: from, from: me, id: id}));
  });

  socket.on("answer", async e => {
    console.log("A: Received an answer");
    const {answer, to, id} = JSON.parse(e);

    // If the answer is to me, register it
    if (to == me) {
      console.log("A: Setting remote desc for outgoing");
      await outgoing[id].setRemoteDescription(answer);
    }
  });

};
