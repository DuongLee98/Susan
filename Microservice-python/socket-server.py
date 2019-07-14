from aiohttp import web
import socketio

import mysql.connector

mydb = mysql.connector.connect(
	host="104.197.239.237",
	user="root",
	passwd="susan123",
	database="susan"
)

mycursor = mydb.cursor()

keywords = {}


def label(cmd):
	labelList = []
	for id in keywords:
		for key in keywords[id]:
			if key in cmd:
				labelList.append(id)
	return labelList

def conclusion(id):
	mycursor.execute("SELECT tblcase.desc FROM tblcase WHERE tblcase.id = {}".format(id))
	rawResponse = mycursor.fetchall()[0][0]
	mycursor.execute("SELECT tblfood.name FROM `tblcf`, `tblfood` WHERE (tblcf.idcase = {} AND tblcf.idfood = tblfood.id)".format(id))
	formattingResponse = ""
	foodList = mycursor.fetchall()
	# print(foodList)
	for enum, tuple in list(enumerate(foodList)):
		formattingResponse += tuple[0]
		if enum < len(foodList) - 1:
			formattingResponse += ", "
	rawResponse = rawResponse.format(formattingResponse)
	return rawResponse

def sugession(idListCase):
	lstId = "("
	for iter, id in enumerate(idListCase):
		lstId += str(id)
		if iter < len(idListCase) - 1:
			lstId += ","
	lstId += ")"
	mycursor.execute("SELECT tbldish.* FROM (SELECT tblfd.iddish FROM tblfd WHERE tblfd.idfood in ( SELECT tblcf.idfood FROM tblcf WHERE tblcf.idcase in {}) GROUP BY tblfd.iddish ORDER BY COUNT(*) DESC) as A LEFT JOIN tbldish ON A.iddish = tbldish.id".format(lstId))
	listDish = mycursor.fetchall()
	return listDish

mycursor.execute("SELECT tblkey.idcase, tblkey.keyword FROM tblkey")

myresult = mycursor.fetchall()

for x in myresult:
	print(x)
	idcase, key = x
	if not idcase in keywords:
		keywords[idcase] = []
	keywords[idcase].append(key)

# creates a new Async Socket IO Server
sio = socketio.AsyncServer()
# Creates a new Aiohttp Web Application
app = web.Application()
# Binds our Socket.IO server to our Web App
# instance
sio.attach(app)

@sio.event
def connect(sid, environ):
    print('connect ', sid)
# we can define aiohttp endpoints just as we normally
# would with no change
async def index(request):
    with open('index.html') as f:
        return web.Response(text=f.read(), content_type='text/html')

# If we wanted to create a new websocket endpoint,
# use this decorator, passing in the name of the
# event we wish to listen out for
@sio.on('message')
async def print_message(sid, message):
	print("Socket ID: " , sid)
	print(message)
	command = message['text']
	# process message
	idListCase = label(command)
	if len(idListCase) > 0:
		print(idListCase)
		sentence = conclusion(idListCase[0])
		print(sentence)
		listDish = sugession(idListCase)
	else:
		sentence = ''
		listDish = {}
    # back to the client
	await sio.emit('mess', {'sentence': sentence, 'listDish': listDish})

@sio.event
def disconnect(sid):
    print('disconnect ', sid)
# We bind our aiohttp endpoint to our app
# router
app.router.add_get('/', index)

# We kick off our server
if __name__ == '__main__':
    web.run_app(app)