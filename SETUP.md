# Aashray: setup on Windows (macOS equivalents included)

Needs: Git, Node.js 22 LTS, Python 3.12, PostgreSQL 16.

## 1. Install

Windows (PowerShell):

    winget install Git.Git
    winget install OpenJS.NodeJS.LTS
    winget install Python.Python.3.12
    winget install PostgreSQL.PostgreSQL.16

Close PowerShell and open a new one afterwards. In the PostgreSQL installer, set a password for the user postgres (letters and numbers only, no @ or :) and keep port 5432. Do not install Stack Builder extras.

macOS: `brew install git node python@3.12 postgresql@16`

Check: `git --version`, `node --version`, `py --version` (macOS: `python3 --version`).

## 2. Clone

    git clone https://github.com/pixelprachi/aashray.git
    cd aashray
    git config user.name "Your Name"
    git config user.email "you@example.com"

## 3. Database (once)

Windows:

    & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE aashray;"

It asks for the postgres password. macOS: `createdb aashray`

Tables are created automatically the first time the backend starts.

## 4. Backend (terminal 1)

Windows:

    cd backend
    py -3.12 -m venv venv
    venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    Copy-Item .env.example .env
    notepad .env

macOS:

    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cp .env.example .env
    open -a "Visual Studio Code" .env

In `.env`: put the postgres password into DATABASE_URL, and put your own Gemini key into GEMINI_API_KEY (create one at https://aistudio.google.com/apikey). Never paste the key into chat, a screenshot or a commit.

If PowerShell says running scripts is disabled, run this once, then retry the activate line:

    Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

Start the server (same on both systems):

    uvicorn app.main:app --reload

Open http://localhost:8000/health. It should show {"status":"ok","db":"connected"}.
After any change to `.env`, stop uvicorn with Ctrl+C and start it again.

## 5. Frontend (terminal 2)

    cd frontend
    npm install
    npm run dev

Open http://localhost:3000. If Windows asks about the firewall, allow access on private networks.

## Windows vs macOS, quick table

| Task | Windows (PowerShell) | macOS (zsh) |
|---|---|---|
| Create venv | `py -3.12 -m venv venv` | `python3 -m venv venv` |
| Activate venv | `venv\Scripts\Activate.ps1` | `source venv/bin/activate` |
| Copy a file | `Copy-Item a b` | `cp a b` |
| Open a file | `notepad .env` | `open -a "Visual Studio Code" .env` |
| Path separator | `\` | `/` |

## Daily git routine

Both of us work on `main`, in small commits.

    git pull --rebase
    (work)
    git add -A
    git commit -m "what changed"
    git pull --rebase
    git push

## Things that do not travel through GitHub

- `.env` (secrets), `backend/storage/` (encrypted blobs) and the database. Vault demo data is local to each machine. Create fresh test data.
- Test the AI features only with invented text. The free Gemini tier may let Google use inputs.
