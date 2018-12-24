import os

import sanic  # type: ignore
import socketio  # type: ignore

app = sanic.Sanic(__name__)

app.static("/", "web")
app.static("/", "web/index.html")

socketio = socketio.AsyncServer(async_mode="sanic")
socketio.attach(app)


@socketio.on("connect")
async def onconnect(sid, environ):
    await socketio.emit("chatmsg", "A user connected")


@socketio.on("disconnect")
async def ondisconnect(sid):
    await socketio.emit("chatmsg", "A user disconnected")


@socketio.on("message")
async def onmessage(sid, msg):
    await socketio.emit("chatmsg", msg)


@socketio.on("offer")
async def onoffer(sid, desc):
    await socketio.emit("offer", desc)


@socketio.on("answer")
async def onanswer(sid, answer):
    await socketio.emit("answer", answer)


@socketio.on("icecandidate")
async def onice(sid, candidate):
    await socketio.emit("icecandidate", candidate)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=os.environ.get("PORT", 8080))
