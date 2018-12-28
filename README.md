# [marchat.herokuapp.com](https://marchat.herokuapp.com)

A webpage that acts as a (voice-)chatroom, using WebRTC P2P
Connections.

## Architecture
 - Broadcasted that a user has connected
 - All previously connected users create an RTCPeerConnection and
    request to connect to the new user.
