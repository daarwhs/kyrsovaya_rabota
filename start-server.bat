@echo off
echo =============================================
echo    MindCare - Запуск локального сервера
echo =============================================
echo.
echo Сайт будет доступен по адресу: http://localhost:8000
echo Нажмите Ctrl+C для остановки сервера
echo.
echo Открываю сайт в браузере...
start http://localhost:8000
echo.
python -m http.server 8000
pause

