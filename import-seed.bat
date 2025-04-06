@echo off
echo FitZone Database Seeding Tool
echo ============================
echo.
echo Select your database type:
echo 1. MariaDB/MySQL
echo 2. SQL Server
echo.
set /p dbtype="Enter your choice (1 or 2): "

if "%dbtype%"=="1" (
    echo.
    echo Importing seed data for MariaDB/MySQL...
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -h 127.0.0.1 -P 3307 -u root < backend\database\mariadb_seed_data.sql
) else if "%dbtype%"=="2" (
    echo.
    echo Importing seed data for SQL Server...
    sqlcmd -S localhost -d fitzone_db -i backend\database\seed_data.sql
) else (
    echo.
    echo Invalid choice. Please run the script again.
    goto end
)

echo.
echo Import complete!

:end
pause
