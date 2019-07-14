import mysql.connector

# susandb = mysql.connector.connect(
#   host="http://104.197.239.237:3306",
#   user="root",
#   password="susan123",
#   database="susan"
# )

# print(susandb)

symptomList = ["đau đầu", "đau bụng", "chướng bụng", "ợ chua", "nóng trong", "cảm"]
symptomID = ["1", "2", "3", "4", "5", "6"]

def label(cmd):
	for i in range(len(symptomList)):
		if symptomList[i] in cmd:
			return symptomID[i]
	return "N/A"

command = input()

print(label(command))	