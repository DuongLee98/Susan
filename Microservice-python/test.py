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
	for id in keywords:
		for key in keywords[id]:
			if key in cmd:
				return id
	return None

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

def asking(question):


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




command = input()
labelList = []
id = label(command)
labelList.append(id)
advise = conclusion(labelList[0])
asking()
dish = sugession(labelList)
