import sqlite3
import os


SQL_DB_NAME = os.getenv('DATA_PATH') + '/waller.db'


def exec_query(query):
  conn = sqlite3.connect(SQL_DB_NAME)
  with conn:
    res = conn.execute(query).fetchall()
  conn.close()
  return res[0] if len(res) == 1 else res


def exec_queries(*queries):
  conn = sqlite3.connect(SQL_DB_NAME)
  with conn:
    for query in queries:
      res = conn.execute(query)
    res = res.fetchall()
  conn.close()
  return res[0] if len(res) == 1 else res


def setup():
  exec_query(
    'CREATE TABLE IF NOT EXISTS img_status(\
    id integer primary key autoincrement,\
    status varchar(20) )'
  )

  
def teardown():
  exec_query("DROP TABLE IF EXISTS img_status")


if __name__ == '__main__':
  # NOTE Uses "production" db for testing, needs change? 
  from dotenv import load_dotenv
  load_dotenv()
  db_path = os.getenv('DATA_PATH') + '/waller.db'
  
  teardown()
  setup()

  id = exec_queries(
    'INSERT INTO img_status (status) VALUES ("queued")',
    'SELECT last_insert_rowid()'
    )
  exec_query('SELECT id FROM img_status')