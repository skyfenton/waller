import sqlite3

SQL_DB_NAME = "temp/waller.db"

def exec_query(query):
  con = sqlite3.connect(SQL_DB_NAME)
  with con:
    res = con.execute(query).fetchall()
    print(res)
  con.close()
  return res

def setup():
  exec_query(
    'CREATE TABLE IF NOT EXISTS img_status(\
    id integer primary key autoincrement,\
    status varchar(20) )'
  )

def teardown():
  exec_query("DROP TABLE IF EXISTS img_status")
  
if __name__ == '__main__':
  teardown()
  setup()
  
  exec_query('SELECT * FROM img_status')