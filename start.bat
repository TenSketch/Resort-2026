@echo off
cd /d "%~dp0"
wt ^
  new-tab -d .\admin cmd /k "npm run dev" ^
  ; new-tab -d .\backend cmd /k "npm run dev" ^
  ; new-tab -d .\frontend cmd /k "npm start"


