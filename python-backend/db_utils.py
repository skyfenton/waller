import sqlite3

SQL_DB_NAME = "data/waller.db"


def setup():
  exec_query(
    'CREATE TABLE IF NOT EXISTS img_status(\
    id integer primary key autoincrement,\
    status varchar(20) )'
  )
  

def teardown():
  exec_query("DROP TABLE IF EXISTS img_status")
  
  
def exec_query(query):
  conn = sqlite3.connect(SQL_DB_NAME)
  with conn:
    res = conn.execute(query).fetchall()
    # print(res)
  conn.close()
  return res[0] if len(res) == 1 else res


def exec_queries(*queries):
  conn = sqlite3.connect(SQL_DB_NAME)
  with conn:
    for query in queries:
      res = conn.execute(query)
    res = res.fetchall()
    # print(res)
  conn.close()
  return res[0] if len(res) == 1 else res

  
if __name__ == '__main__':
  teardown()
  setup()

  id = exec_queries(
    'INSERT INTO img_status (status) VALUES ("queued")',
    'SELECT last_insert_rowid()'
    )
  exec_query('SELECT id FROM img_status')