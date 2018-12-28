# [marchat.herokuapp.com](https://marchat.herokuapp.com)

## UX
 - Load webpage
 - Immediately be connected (P2P) to all others who are on the
   webpage.

## Architecture
 - Broadcasted that a user has connected
 - All previously connected users create an RTCPeerConnection and
    request to connect to the new user.

### State
 - Connections
   - Incoming (to accept)
   - Outgoing (to send)
