# Hospital Patient Queue and Resource Scheduler
 
A scheduler for the waiting patients of an outpatient (OPD) or urgent-care clinic. It decides which patient is called next and which doctor sees them. It was built for the Design and Analysis of Algorithms project (CIC-359) at Maharaja Surajmal Institute of Technology, GGSIPU. It is not meant for an emergency ward.
 
## The problem
 
In an outpatient department or urgent-care clinic, patients keep arriving and several doctors with different specialities are available. Two questions come up again and again: who should be seen next, and by which doctor.
 
Serving patients strictly in the order they arrive ignores urgency, so someone who needs care quickly waits behind routine visits. Serving strictly by urgency has the opposite problem, because a routine patient can be pushed back again and again and never be seen. On top of that, a patient can only go to a doctor with the right speciality, so handing out the next free doctor one patient at a time can leave a specialist idle while another patient waits.
 
This project solves these problems with two algorithms from the course. A min-heap with an ageing key chooses the order, so urgent patients go first and nobody is starved. Bipartite matching then assigns free doctors, so the largest possible number of patients start treatment together. Reception staff register patients and doctors finish treatments through simple web screens, and the whole state survives a restart.
 
## How it works
 
- **Waiting queue:** patients sit in a binary min-heap. The key is the arrival time in minutes plus a handicap set by urgency (Critical 0, High 15, Medium 45, Low 90). Urgent patients go first, but a routine patient can only be overtaken by someone who arrives within the handicap, so nobody waits forever.
- **Doctor allocation:** free doctors are assigned by maximum bipartite matching with augmenting paths (Kuhn's algorithm). As many waiting patients as possible start together, and a busy specialist does not block the queue behind.
- **Treatment** is non-preemptive. Once a patient is with a doctor, they finish.
- **Storage:** every action is saved in a SQLite file, so the system resumes correctly after a restart.
## Tools used
 
Python, FastAPI and Pydantic for the backend, SQLite for storage, and React, Vite and Tailwind CSS for the Reception and Doctor screens. The screens refresh every three seconds.
 
## Running it
 
You need Python 3.10 or newer.
 
```bash
cd Backend
pip install -r requirements.txt
python run.py
```
 
The program starts at http://127.0.0.1:8000 and opens your browser. Keep the terminal open while you use it, and close it to stop. Patient and doctor records are saved in `hospital.db` in the folder you started it from.
 
The built frontend is already in `frontend/dist`, so Node.js is not needed to run the project.
 
To change the frontend:
 
```bash
cd frontend
npm install
npm run build
```
 
## Project layout
 
```
Backend/
  algorithms/
    min_heap.py            min-heap with build_heap
    bipartite_matching.py  maximum matching with augmenting paths
    scheduler.py           queue, ageing key, allocation, estimates
  main.py                  FastAPI routes and validation
  storage.py               SQLite persistence
  run.py                   launcher (starts the server, opens the browser)
  backend_requirements.txt         Python libraries
frontend/
  src/
    pages/                 Home, Reception and Doctor screens
    components/            Navbar, doctors strip, urgency badge, status banner, confirm dialog
    utils/api.js           calls to the backend API
    App.jsx, main.jsx      app routes and entry point
    index.css              Tailwind styles
  dist/                    built frontend, served by the backend
  public/                  favicon
  package.json             frontend tools (installed with npm install)
  frontend_requirements.txt         list of frontend tools
    index.html, vite.config.js, tailwind.config.js, postcss.config.js, package-lock.json
prototype images/          screenshots of the screens
```
 
## Screens
 
**Home page**
 
![Home page](<prototype images/Home Page.png>)
 
**Reception screen**
 
![Reception screen 1](<prototype images/Reception Screen 1.png>)
![Reception screen 2](<prototype images/Reception Screen 2.png>)
 
**Doctor availability strip**
 
![Doctor availability strip](<prototype images/Doctor Availability Strip.png>)
 
**Doctor screen**
 
![Doctor screen 1](<prototype images/Doctor Screen 1.png>)
![Doctor screen 2](<prototype images/Doctor Screen 2.png>)
![Doctor screen 3](<prototype images/Doctor Screen 3.png>)
 
## Licence
 
See [LICENSE](LICENSE).
 