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
    exec_queries(
        """CREATE TABLE IF NOT EXISTS Statuses
        (
        StatusID integer primary key,
        Desc varchar(20) not null
        )""",
        """CREATE TABLE IF NOT EXISTS Jobs
        (
        JobID integer primary key autoincrement,
        StatusID integer not null default 0,
        FOREIGN KEY(StatusID) REFERENCES Statuses(StatusID)
        )""",
        """INSERT INTO Statuses (StatusID, Desc)
        VALUES
            (0, "uploading"),
            (1, "queued"),
            (2, "processing"),
            (3, "done")    
        """,
    )


def teardown():
    exec_queries("DROP TABLE IF EXISTS Jobs", "DROP TABLE IF EXISTS Statuses")


if __name__ == "__main__":
    # Test queries

    teardown()
    setup()

    id = exec_queries(
        "INSERT INTO Jobs DEFAULT VALUES",
        "SELECT last_insert_rowid()",
    )[0]
    query = exec_query(f"SELECT * FROM Jobs WHERE JobID = {id}")
    print(query)
