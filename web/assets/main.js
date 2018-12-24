let socket;

/** @type {[string: RTCPeerConnection]} */
const outgoing = {};
const incoming = {};

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

window.onload = async function () {
  socket = io();

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
  
  // Send an offer out
  let conn = new RTCPeerConnection(peerConnectionConfig);

  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });
  localStream.getTracks().forEach(track => conn.addTrack(track, localStream));

  let elt = document.createElement("audio");
  ["controls", "autoplay"].forEach(x => elt.setAttribute(x, ""));

  elt.srcObject = conn.getLocalStreams()[0];
  document.body.appendChild(elt);


  let desc = await conn.createOffer({
    offerToReceiveAudio: true,
    voiceActivityDetection: true,
    offerToReceiveVideo: false,
  });

  outgoing[desc.sdp] = conn;

  console.log("Sending out an offer", desc);
  await conn.setLocalDescription(desc);
  await socket.emit("offer", JSON.stringify({desc}));

  conn.onicecandidate = async e => {
    await socket.emit("icecandidate", JSON.stringify({
      candidate: e.candidate,
      sdp: conn.localDescription.sdp,
    }));
  };

  conn.onnegotiationneeded = async () => {
    console.log("Negotiation needed");
  };

  socket.on("icecandidate", async (e) => {
    const data = JSON.parse(e);

    console.log("RECEIVED ICE CANDIDATE", data);

    if (incoming[data.sdp]) {
      console.log("Adding received ice candidate");
      await incoming[data.sdp].addIceCandidate(
        data.candidate
          ? new RTCIceCandidate(data.candidate)
          : null
      );
    }

  });

  socket.on("offer", async e => {
    console.log("Received an offer");
    const {desc} = JSON.parse(e);

    // Accept the offer
    const peerConn = new RTCPeerConnection(peerConnectionConfig);

    peerConn.ontrack = e => {
      console.log("incoming got track");
      const audio = document.createElement("audio");
      audio.setAttribute("autoplay", "");
      audio.setAttribute("controls", "");
      console.log(e);
      audio.srcObject = e.streams[0];

      document.body.appendChild(audio);
    };

    console.log("Setting remote desc of incoming");
    await peerConn.setRemoteDescription(desc);

    console.log("Creating answer for incoming");
    const answer = await peerConn.createAnswer();

    console.log("Setting answer as local desc for incoming");
    await peerConn.setLocalDescription(answer);

    incoming[answer.sdp] = peerConn;

    await socket.emit("answer", JSON.stringify({from: answer, to: desc}));
  });

  socket.on("answer", async e => {
    console.log("Received an answer");
    const {from, to} = JSON.parse(e);

    // If the answer is to me, register it
    if (outgoing[to.sdp]) {
      console.log("Setting remote desc for outgoing");
      await outgoing[to.sdp].setRemoteDescription(from);
    }
  });

};
