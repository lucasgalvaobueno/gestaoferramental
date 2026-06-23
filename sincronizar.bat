@echo off
echo Sincronizando com o GitHub...
"%LOCALAPPDATA%\Programs\Git\cmd\git.exe" add .
"%LOCALAPPDATA%\Programs\Git\cmd\git.exe" commit -m "Atualizacao automatica"
"%LOCALAPPDATA%\Programs\Git\cmd\git.exe" push origin main
echo.
echo Sincronizacao concluida!
pause
