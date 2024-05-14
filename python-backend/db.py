import sqlite3
from dotenv import dotenv_values

# NOTE Uses "production" db for testing, needs change?
# TODO replace reading env with data struct in a config.py file
SQL_DB_PATH = dotenv_values().get("DATA_PATH") + "/waller.db"


def exec_query(query):
    conn = sqlite3.connect(SQL_DB_PATH)
    with conn:
        res = conn.execute(query).fetchall()
    conn.close()
    return res[0] if len(res) == 1 else res


def exec_queries(*queries):
    conn = sqlite3.connect(SQL_DB_PATH)
    with conn:
        for query in queries:
            res = conn.execute(query)
        res = res.fetchall()
    conn.close()
    return res[0] if len(res) == 1 else res


def setup():
    exec_query(
        "CREATE TABLE IF NOT EXISTS img_status(\
        id integer primary key autoincrement,\
        status varchar(20) )"
    )


def teardown():
    exec_query("DROP TABLE IF EXISTS img_status")


if __name__ == "__main__":
    # Test queries

    teardown()
    setup()

    id = exec_queries(
        'INSERT INTO img_status (status) VALUES ("queued")',
        "SELECT last_insert_rowid()",
    )
    exec_query("SELECT id FROM img_status")
