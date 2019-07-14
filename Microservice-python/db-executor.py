import mysql.connector

mydb = mysql.connector.connect(
  host="104.197.239.237",
  user="root",
  passwd="susan123",
  database="susan"
)

mycursor = mydb.cursor()

mycursor.execute("SELECT * FROM tblcase")

myresult = mycursor.fetchall()

for x in myresult:
  print(x)