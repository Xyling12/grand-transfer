@echo off
chcp 65001 > nul
echo ====================================================
echo    Обновление сайта на сервере 155.212.216.227
echo ====================================================
echo.

echo [1/4] Упаковка новых файлов проекта (это займет пару секунд)...
cd %~dp0
tar.exe -czf grand-transfer.tar.gz --exclude="node_modules" --exclude=".next" --exclude=".git" .
if %errorlevel% neq 0 (
    echo Ошибка при архивации.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Отправка файлов на сервер...
echo Пожалуйста, введите пароль от сервера (nQ%%RJGoHF7kZ)
scp -o StrictHostKeyChecking=no grand-transfer.tar.gz root@155.212.216.227:/root/
if %errorlevel% neq 0 (
    echo Ошибка при отправке файлов.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/4] Распаковка новых файлов и сборка на сервере...
echo Пожалуйста, введите пароль от сервера еще раз:
ssh -o StrictHostKeyChecking=no root@155.212.216.227 "tar -xzf /root/grand-transfer.tar.gz -C /var/www/grand-transfer && cd /var/www/grand-transfer && npm install && npm run build && pm2 reload all"

echo.
echo ====================================================
echo    Готово! Сайт успешно обновлен! 
echo ====================================================
pause
