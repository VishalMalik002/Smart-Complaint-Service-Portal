@echo off
cd /d "%~dp0backend"
echo Starting SmartServe backend on http://localhost:8080 ...
mvn spring-boot:run
pause
