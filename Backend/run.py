import socket
import threading
import time
import webbrowser
import uvicorn
from main import app
URL="http://127.0.0.1:8000"
def port_in_use():
    with socket.socket() as s:
        return s.connect_ex(("127.0.0.1",8000))==0
def open_browser():
    time.sleep(1.5)
    webbrowser.open(URL)
if port_in_use():
    webbrowser.open(URL)
else:
    threading.Thread(target=open_browser,daemon=True).start()
    print("Hospital Queue Scheduler is running at "+URL)
    print("Keep this window open. Close it to stop the program.")
    uvicorn.run(app,host="127.0.0.1",port=8000,log_level="warning")