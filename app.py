import flask
import flask_socketio
from flask_socketio import SocketIO

app = flask.Flask(__name__)

socketio = SocketIO(app)


@socketio.on("connect")
def onconnect():
    print("Client connected")


@socketio.on("message")
def onmessage(msg):
    if isinstance(msg, str):
        flask_socketio.emit("chatmsg", msg, broadcast=True)
        print(msg)
    else:
        print(type(msg))
        flask_socketio.emit("d", msg)


socketio.run(app, host="0.0.0.0", port=59880)
