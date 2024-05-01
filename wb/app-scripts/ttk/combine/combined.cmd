@echo off
setlocal enabledelayedexpansion

:: Удаляем старый combined.js, если он существует
if exist combined.js del combined.js

:: Добавляем файлы JS из директории ..\app\
for %%f in (..\app\*.js) do (
    type "%%f" >> combined.js
    echo.>> combined.js
)

echo Файл combined.js успешно создан.