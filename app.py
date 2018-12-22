import os
ilask = "*"
flask-socketio = "*"
import sanic  # type: ignore
from sanic import websocket
import socketio

app = sanic.Sanic(__name__)
app.static("/", "web/index.html")

socketio = socketio.AsyncServer(async_mode="sanic")
socketio.attach(app)


@socketio.on("connect")
async def onconnect(sio, environ):
    await socketio.emit("chatmsg", "A user connected", broadcast=True)


@socketio.on("disconnect")
async def ondisconnect(sid):
    await socketio.emit("chatmsg", "A user disconnected", broadcast=True)


@socketio.on("message")
async def onmessage(sid, msg):
    if isinstance(msg, str):
        await socketio.emit("chatmsg", msg, broadcast=True)
    else:
        await socketio.emit("d", msg, broadcast=True, include_self=False)


app.run(host="0.0.0.0", port=os.environ.get("PORT", 8080))
