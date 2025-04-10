@echo off
echo ===================================================
echo FitZone Docker Database Reset Tool
echo ===================================================
echo This will stop all containers, remove the database volume, and restart everything
echo with a fresh database that includes all tables and initial data.
echo.
echo IMPORTANT: All existing database data will be lost!
echo.

pause

echo.
echo Stopping all containers...
docker-compose down

echo.
echo Removing database volume...
docker volume rm site-fitness_fitzone-db-data

echo.
echo Starting containers with clean database...
docker-compose up -d

echo.
echo Database reset initiated. Check logs to confirm success:
echo docker logs fitzone-database
echo.
echo Process complete! Your database should now be initialized with all tables.