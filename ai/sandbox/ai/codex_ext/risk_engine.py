import re
from . import state

def score(sql: str):

    s = 0

    if re.search(r"drop table", sql, re.I):
        s += 60

    if re.search(r"delete", sql, re.I):
        s += 25

    if re.search(r"alter table", sql, re.I):
        s += 30

    if re.search(r"update", sql, re.I):
        s += 10

    if "where" not in sql.lower():
        s += 40

    state.log("risk_eval",{"sql":sql,"score":s})

    return min(s,100)
