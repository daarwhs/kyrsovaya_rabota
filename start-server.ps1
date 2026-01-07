# MindCare - Запуск локального сервера
Write-Host "============================================="
Write-Host "   MindCare - Запуск локального сервера"
Write-Host "============================================="
Write-Host ""
Write-Host "Сайт будет доступен по адресу: http://localhost:8000"
Write-Host "Нажмите Ctrl+C для остановки сервера"
Write-Host ""

# Открываем сайт в браузере
Start-Process "http://localhost:8000"

# Запускаем сервер
python -m http.server 8000

