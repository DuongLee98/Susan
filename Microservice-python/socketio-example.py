import socketio

sio = socketio.Client()

@sio.event
def connect():
    print('connection established')

@sio.event
def my_message(data):
    print('message received with ', data)
    sio.emit('request', {'response': 'my response'})

@sio.on("response")
def my_event(data):
	print("recieved: ", data)

@sio.event
def disconnect():
    print('disconnected from server')

sio.connect('http://0.0.0.0:8080')

sio.send('Connection successful from this side, thanks for opening')
