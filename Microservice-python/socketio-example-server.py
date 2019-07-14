import eventlet
import socketio
import test
sio = socketio.Server()
app = socketio.WSGIApp(sio, static_files={
    '/': {'content_type': 'text/html', 'filename': 'index.html'}
})

@sio.event
def connect(sid, environ):
    print('connect ', sid)

@sio.on("request")
def my_event(sid, data):
    # get list idcase
	# idList = label(data)
	# # create respond sentence
	# response = conclusion(idList[0])
	print("recived data from ", data)
	sio.emit('message', 'ok baby')
	
@sio.event
def disconnect(sid):
    print('disconnect ', sid)



if __name__ == '__main__':
    eventlet.wsgi.server(eventlet.listen(('172.16.76.95', 5000)), app)