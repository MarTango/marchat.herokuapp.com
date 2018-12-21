import os
import flask
import flask_socketio
from flask_socketio import SocketIO

app = flask.Flask(__name__, static_url_path="/web")

socketio = SocketIO(app)


@app.route("/")
def index():
    return flask.send_from_directory("web", "index.html")


@socketio.on("connect")
def onconnect():
    print("Client connected")
    flask_socketio.emit("chatmsg", "A user connected", broadcast=True)


@socketio.on("disconnect")
def ondisconnect():
    flask_socketio.emit("chatmsg", "A user disconnected", broadcast=True)


@socketio.on("message")
def onmessage(msg):
    if isinstance(msg, str):
        flask_socketio.emit("chatmsg", msg, broadcast=True)
        print(msg)
    else:
        print(type(msg))
        flask_socketio.emit("d", msg, broadcast=True, include_self=False)


socketio.run(app, host="0.0.0.0", port=os.environ.get("PORT", 8080))
