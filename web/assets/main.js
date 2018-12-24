let socket;

const messages = document.querySelector("ul#messages");
const message = document.querySelector("#m");

document.querySelector("form").addEventListener('submit', (e) => {
  e.preventDefault();
  socket.send(message.value);
  message.value = "";
});

let peerConnection = new RTCPeerConnection({
  iceServers: [
    {urls:['stun:stun.l.google.com:19302']},
    {urls:['stun:stun1.l.google.com:19302']},
    {urls:['stun:stun2.l.google.com:19302']},
    {urls:['stun:stun3.l.google.com:19302']},
 ],
});

async function main() {
  socket = io();
  socket.on('connect', () => {
    console.log('Connected');
  });

  socket.on("chatmsg", msg => {
    let elt = document.createElement("li");
    elt.appendChild(document.createTextNode(msg));
    messages.appendChild(elt);
  });
  
  const ctx = new AudioContext();

  /** 
   * @param {ArrayBuffer} data
   */
  socket.on("audio", async (data) => {
    let src = ctx.createBufferSource();
    src.buffer = await ctx.decodeAudioData(data);
    src.connect(ctx.destination);
    src.start(0);
  });

  const rec = new MediaRecorder(
    await navigator.mediaDevices.getUserMedia({audio: true})
  );

  rec.start(); // send 1 chunk per sec

  setInterval(() => {
    rec.stop();
    rec.start();
  }, 1000);

  const mutedElt = document.querySelector("input#muted");

  rec.ondataavailable = (e) => {
    if (!mutedElt.checked) {
      socket.emit("audio", e.data);
    }
  };
}

main();
