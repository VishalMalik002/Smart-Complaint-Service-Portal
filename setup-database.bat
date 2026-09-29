@echo off
where mysql >nul 2>&1
if errorlevel 1 (echo MySQL CLI not found. Start XAMPP MySQL; Spring Boot will create the database automatically.&pause&exit /b 0)
mysql -u root -e "CREATE DATABASE IF NOT EXISTS smartserve;"
echo SmartServe database ready.
pause
