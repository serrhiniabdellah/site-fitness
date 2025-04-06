@echo off
echo Importing database seed data...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -h 127.0.0.1 -P 3307 -u root < backend\database\seed_data.sql
echo Import complete!
pause
